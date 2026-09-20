import type {Pool} from 'pg';

type EvidenceStatus='OK'|'WARNING'|'CRITICAL';

export async function reconcileOperation(pool:Pool,operationId:string){
  const id=operationId.trim();
  if(!id||id.length>200)throw new Error('invalid_operation_id');

  const [orders,withdrawals,trades,providerOrders,settlements,provenance,reservations,audit]=await Promise.all([
    pool.query('SELECT id,customer_id,side,status,quantity::text,filled_quantity::text,operation_id FROM orders WHERE operation_id=$1 ORDER BY id',[id]),
    pool.query('SELECT id,customer_id,asset_id,amount::text,status,approval_status,provider_withdrawal_id,provider_completed_at,operation_id FROM withdrawals WHERE operation_id=$1 ORDER BY id',[id]),
    pool.query('SELECT t.id,t.order_id,t.operation_id,t.quantity::text,t.quote_amount::text,o.side,o.status FROM trades t JOIN orders o ON o.id=t.order_id WHERE t.operation_id=$1 OR o.operation_id=$1 ORDER BY t.id',[id]),
    pool.query('SELECT po.id,po.customer_order_id,po.operation_id,po.status,po.settlement_status,po.quantity::text,po.settled_quantity::text,po.settled_quote_amount::text,po.settled_provider_fee_amount::text,po.provider_order_id,po.client_order_id FROM provider_orders po WHERE po.operation_id=$1 OR po.customer_order_id IN (SELECT id FROM orders WHERE operation_id=$1) ORDER BY po.id',[id]),
    pool.query('SELECT pts.id,pts.provider_order_id,pts.customer_order_id,pts.operation_id,pts.quantity::text,pts.quote_amount::text,pts.customer_fee_amount::text,pts.provider_fee_amount::text,pts.status FROM provider_trade_settlements pts WHERE pts.operation_id=$1 OR pts.customer_order_id IN (SELECT id FROM orders WHERE operation_id=$1) ORDER BY pts.id',[id]),
    pool.query('SELECT id,customer_id,asset_id,direction,amount::text,source_type,source_id,operation_id FROM asset_provenance WHERE operation_id=$1 ORDER BY id',[id]),
    pool.query('SELECT wr.id,wr.order_id,wr.withdrawal_id,wr.wallet_id,wr.amount::text,wr.consumed_amount::text,wr.status,wr.resolved_at FROM wallet_reservations wr WHERE wr.order_id IN (SELECT id FROM orders WHERE operation_id=$1) OR wr.withdrawal_id IN (SELECT id FROM withdrawals WHERE operation_id=$1) ORDER BY wr.id',[id]),
    pool.query('SELECT id,event_type,aggregate_type,aggregate_id,previous_hash,event_hash FROM operation_audit_events WHERE operation_id=$1 ORDER BY id',[id])
  ]);

  const checks:any[]=[];
  const check=(name:string,status:EvidenceStatus,details:unknown)=>checks.push({name,status,details});

  if(!orders.rows.length&&!withdrawals.rows.length&&!trades.rows.length&&!providerOrders.rows.length&&!settlements.rows.length)
    check('operation_exists','CRITICAL','No financial aggregate is linked to this operation');
  else check('operation_exists','OK',{orders:orders.rows.length,withdrawals:withdrawals.rows.length,trades:trades.rows.length,providerOrders:providerOrders.rows.length,settlements:settlements.rows.length});

  for(const po of providerOrders.rows){
    const linked=settlements.rows.filter((s:any)=>Number(s.provider_order_id)===Number(po.id));
    const settledQty=linked.reduce((sum:number,s:any)=>sum+Number(s.quantity),0);
    const settledQuote=linked.reduce((sum:number,s:any)=>sum+Number(s.quote_amount),0);
    const qtyOk=Math.abs(settledQty-Number(po.settled_quantity))<=1e-12;
    const quoteOk=Math.abs(settledQuote-Number(po.settled_quote_amount))<=1e-12;
    check('provider_settlement_consistency',qtyOk&&quoteOk?'OK':'CRITICAL',{providerOrderId:po.id,providerOrderQuantity:po.quantity,providerSettledQuantity:po.settled_quantity,evidenceSettledQuantity:String(settledQty),providerSettledQuote:po.settled_quote_amount,evidenceSettledQuote:String(settledQuote),settlementStatus:po.settlement_status});
  }

  for(const order of orders.rows){
    const rs=reservations.rows.filter((r:any)=>Number(r.order_id)===Number(order.id));
    const bad=rs.some((r:any)=>Number(r.consumed_amount)>Number(r.amount)+1e-12);
    if(!rs.length&&['filled','cancelled','completed','rejected'].includes(String(order.status)))
      check('reservation_lifecycle','CRITICAL',{orderId:order.id,status:order.status,reason:'terminal_order_without_reservation_evidence'});
    else check('reservation_lifecycle',bad?'CRITICAL':'OK',{orderId:order.id,reservations:rs.length});
  }

  if(providerOrders.rows.length){
    const missing=providerOrders.rows.filter((p:any)=>Number(p.settled_quantity)>0&&!settlements.rows.some((s:any)=>Number(s.provider_order_id)===Number(p.id)));
    check('provider_execution_to_settlement',missing.length?'CRITICAL':'OK',{providerOrders:providerOrders.rows.length,missingSettlementProviderOrders:missing.map((p:any)=>p.id)});
  }

  if(provenance.rows.length){
    const invalid=provenance.rows.some((p:any)=>String(p.operation_id)!==id||Number(p.amount)<=0);
    check('asset_provenance',invalid?'CRITICAL':'OK',{entries:provenance.rows.length});
  }else if(orders.rows.length||withdrawals.rows.length)check('asset_provenance','WARNING','Financial operation has no asset provenance evidence yet');

  const accounting={available:false,transactions:[] as any[],error:null as string|null};
  const accountingUrl=process.env.ACCOUNTING_SERVICE_URL;
  const accountingToken=process.env.ACCOUNTING_INTERNAL_TOKEN;
  if(accountingUrl&&accountingToken){
    try{
      const response=await fetch(accountingUrl.replace(/\/$/,'')+'/internal/v1/ledger/transactions/by-operation/'+encodeURIComponent(id),{headers:{authorization:'Bearer '+accountingToken},signal:AbortSignal.timeout(Number(process.env.ACCOUNTING_HTTP_TIMEOUT_MS??5000))});
      const body:any=await response.json().catch(()=>({}));
      if(response.ok){accounting.available=true;accounting.transactions=body.transactions??[];}else accounting.error='accounting_http_'+response.status;
    }catch{accounting.error='accounting_unavailable';}
  }else accounting.error='accounting_not_configured';

  if((orders.rows.length||withdrawals.rows.length||settlements.rows.length)&&!accounting.available)check('accounting_availability','CRITICAL',accounting.error);
  else if(accounting.available)check('accounting_presence',accounting.transactions.length?'OK':'CRITICAL',{transactionCount:accounting.transactions.length});

  for(const withdrawal of withdrawals.rows){
    const providerComplete=Boolean(withdrawal.provider_withdrawal_id&&withdrawal.provider_completed_at)||String(withdrawal.status)==='completed';
    const accountingLinked=accounting.transactions.some((x:any)=>String(x.transaction?.reference_type??'')==='exchange_withdrawal'&&String(x.transaction?.reference_id??'')===String(withdrawal.id));
    if(String(withdrawal.status)==='completed')check('withdrawal_completion_consistency',providerComplete&&accountingLinked?'OK':'CRITICAL',{withdrawalId:withdrawal.id,providerComplete,accountingLinked});
    else if(String(withdrawal.approval_status)==='APPROVED')check('withdrawal_completion_consistency','WARNING',{withdrawalId:withdrawal.id,status:withdrawal.status,providerWithdrawalId:withdrawal.provider_withdrawal_id});
  }

  if(audit.rows.length){
    let chainOk=true;
    for(let i=0;i<audit.rows.length;i++){const previous=i===0?null:audit.rows[i-1].event_hash;if((audit.rows[i].previous_hash??null)!==(previous??null)){chainOk=false;break;}}
    check('audit_chain_integrity',chainOk?'OK':'CRITICAL',{events:audit.rows.length});
  }else if(orders.rows.length||withdrawals.rows.length||settlements.rows.length)check('audit_chain_presence','WARNING','Financial operation has no audit event yet');

  const rank=(s:EvidenceStatus)=>s==='CRITICAL'?2:s==='WARNING'?1:0;
  const overall:EvidenceStatus=checks.reduce((max,s)=>rank(s.status)>rank(max)?s.status:max,'OK' as EvidenceStatus);
  const evidence={operationId:id,checkedAt:new Date().toISOString(),status:overall,checks,summary:{orders:orders.rows.length,withdrawals:withdrawals.rows.length,trades:trades.rows.length,providerOrders:providerOrders.rows.length,settlements:settlements.rows.length,provenance:provenance.rows.length,reservations:reservations.rows.length,auditEvents:audit.rows.length,accountingTransactions:accounting.transactions.length}};

  await pool.query('INSERT INTO operation_reconciliation_evidence(operation_id,status,evidence,error_message) VALUES($1,$2,$3,NULL) ON CONFLICT(operation_id) DO UPDATE SET status=EXCLUDED.status,checked_at=NOW(),evidence=EXCLUDED.evidence,error_message=NULL',[id,overall,evidence]);
  return {operationId:id,status:overall,evidence};
}
