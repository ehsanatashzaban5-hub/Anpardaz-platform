export type FinnotechServiceCode =
  | 'account.transfer'
  | 'account.transfer.saderat'
  | 'account.direct_debit'
  | 'account.paya'
  | 'account.internal_transfer'
  | 'account.satna'
  | 'account.bill_payment'
  | 'account.پل'
  | 'account.statement'
  | 'account.offline_statement'
  | 'account.merchant_statement'
  | 'account.bancard_statement'
  | 'account.balance'
  | 'card.balance'
  | 'bancard.balance'
  | 'bancard.charge'
  | 'commercial_card.charge'
  | 'commercial_card.discharge'
  | 'card.settlement'
  | 'card.batch_settlement'
  | 'card.batch_settlement_file'
  | 'account.to_shaparak_card'
  | 'kiliid.active_accounts'
  | 'kiliid.requests'
  | 'kiliid.delete_payment_order'
  | 'kiliid.payment_order'
  | 'iban.account_number'
  | 'iban.info'
  | 'iban.inquiry_batch'
  | 'iban.inquiry_batch_file'
  | 'card.inquiry'
  | 'card.to_account'
  | 'card.to_iban'
  | 'card.to_iban_batch'
  | 'card.to_iban_batch_file'
  | 'account.to_iban'
  | 'account.inquiry'
  | 'account.info'
  | 'shahab.sms_inquiry'
  | 'shahab.inquiry'
  | 'customer.number'
  | 'customer.info'
  | 'customer.type'
  | 'customer.blacklist'
  | 'postal_code.inquiry'
  | 'customer.cards'
  | 'bank.list'
  | 'identity.national_id_mobile'
  | 'identity.national_id_mobile_verify'
  | 'identity.national_id_sms_verify'
  | 'identity.shaba_national_id_birthdate'
  | 'identity.shaba_national_id'
  | 'identity.signature'
  | 'identity.life_status'
  | 'identity.face_compare'
  | 'identity.national_card_face'
  | 'identity.live_video_national_card'
  | 'identity.national_id_account'
  | 'identity.military_service'
  | 'identity.passport'
  | 'identity.company_members'
  | 'identity.national_card_read'
  | 'bill.inquiry'
  | 'bill.inquiry_detail'
  | 'vehicle.violation_image'
  | 'vehicle.negative_points'
  | 'vehicle.violation'
  | 'vehicle.motorcycle_violation'
  | 'vehicle.traffic_plan'
  | 'vehicle.ownership'
  | 'vehicle.active_plates'
  | 'vehicle.info'
  | 'vehicle.freeway_toll'
  | 'vehicle.license_status'
  | 'vehicle.plate_history'
  | 'insurance.third_party_history'
  | 'insurance.driver_risk'
  | 'check.color'
  | 'check.sayad_inquiry'
  | 'check.sayad_register'
  | 'check.sms_inquiry'
  | 'check.sms_verify'
  | 'check.sms_cancel'
  | 'check.issuer_sms_inquiry'
  | 'check.issuer_inquiry'
  | 'check.transfer'
  | 'check.book_inquiry'
  | 'check.id'
  | 'check.bounced_sms_inquiry'
  | 'loan.sms_inquiry'
  | 'guarantee.sms_inquiry'
  | 'guarantee.info'
  | 'guarantee.collateral'
  | 'credit.transactional_inquiry'
  | 'credit.makna'
  | 'credit.score'
  | 'sms.send'
  | 'sms.inquiry'
  | 'sms.otp'
  | 'recharge.request'
  | 'recharge.send'
  | 'recharge.pin'
  | 'recharge.pin_status'
  | 'recharge.products'
  | 'recharge.wallet_balance'
  | 'recharge.request_status'
  | 'digital_promissory.issue'
  | 'digital_promissory.sms_issue'
  | 'digital_promissory.delete'
  | 'digital_promissory.finalize'
  | 'digital_promissory.guarantee'
  | 'digital_promissory.inquiry'
  | 'digital_promissory.draft_inquiry'
  | 'digital_signature.request'
  | 'digital_signature.status'
  | 'digital_signature.document'
  | 'keeylid.payment_order.create'
  | 'keeylid.payment_order.update'
  | 'keeylid.paya_request'
  | 'keeylid.internal_payment_order'
  | 'keeylid.combined_payment_order';

export const FINNOTECH_SERVICE_CODES = new Set<string>([
  'account.transfer','account.transfer.saderat','account.direct_debit','account.paya',
  'account.internal_transfer','account.satna','account.bill_payment','account.پل',
  'account.statement','account.offline_statement','account.merchant_statement',
  'account.bancard_statement','account.balance','card.balance','bancard.balance',
  'bancard.charge','commercial_card.charge','commercial_card.discharge','card.settlement',
  'card.batch_settlement','card.batch_settlement_file','account.to_shaparak_card',
  'kiliid.active_accounts','kiliid.requests','kiliid.delete_payment_order','kiliid.payment_order',
  'iban.account_number','iban.info','iban.inquiry_batch','iban.inquiry_batch_file',
  'card.inquiry','card.to_account','card.to_iban','card.to_iban_batch','card.to_iban_batch_file',
  'account.to_iban','account.inquiry','account.info','shahab.sms_inquiry','shahab.inquiry',
  'customer.number','customer.info','customer.type','customer.blacklist','postal_code.inquiry',
  'customer.cards','bank.list','identity.national_id_mobile','identity.national_id_mobile_verify',
  'identity.national_id_sms_verify','identity.shaba_national_id_birthdate','identity.shaba_national_id',
  'identity.signature','identity.life_status','identity.face_compare','identity.national_card_face',
  'identity.live_video_national_card','identity.national_id_account','identity.military_service',
  'identity.passport','identity.company_members','identity.national_card_read','bill.inquiry',
  'bill.inquiry_detail','vehicle.violation_image','vehicle.negative_points','vehicle.violation',
  'vehicle.motorcycle_violation','vehicle.traffic_plan','vehicle.ownership','vehicle.active_plates',
  'vehicle.info','vehicle.freeway_toll','vehicle.license_status','vehicle.plate_history',
  'insurance.third_party_history','insurance.driver_risk','check.color','check.sayad_inquiry',
  'check.sayad_register','check.sms_inquiry','check.sms_verify','check.sms_cancel',
  'check.issuer_sms_inquiry','check.issuer_inquiry','check.transfer','check.book_inquiry','check.id',
  'check.bounced_sms_inquiry','loan.sms_inquiry','guarantee.sms_inquiry','guarantee.info',
  'guarantee.collateral','credit.transactional_inquiry','credit.makna','credit.score','sms.send',
  'sms.inquiry','sms.otp','recharge.request','recharge.send','recharge.pin','recharge.pin_status',
  'recharge.products','recharge.wallet_balance','recharge.request_status','digital_promissory.issue',
  'digital_promissory.sms_issue','digital_promissory.delete','digital_promissory.finalize',
  'digital_promissory.guarantee','digital_promissory.inquiry','digital_promissory.draft_inquiry',
  'digital_signature.request','digital_signature.status','digital_signature.document',
  'keeylid.payment_order.create','keeylid.payment_order.update','keeylid.paya_request',
  'keeylid.internal_payment_order','keeylid.combined_payment_order'
]);

export function isFinnotechServiceCode(value: string): value is FinnotechServiceCode {
  return FINNOTECH_SERVICE_CODES.has(value);
}
