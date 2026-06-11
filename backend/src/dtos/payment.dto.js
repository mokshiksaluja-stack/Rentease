export class PaymentDTO {
  constructor(payment) {
    this.id = payment.id;
    this.bookingId = payment.bookingId;
    this.tenantId = payment.tenantId;
    this.landlordId = payment.landlordId;
    this.stripePaymentIntentId = payment.stripePaymentIntentId;
    this.amount = Number(payment.amount);
    this.currency = payment.currency;
    this.status = payment.status;
    this.paymentMethod = payment.paymentMethod;
    this.receiptUrl = payment.receiptUrl;
    this.attemptNumber = payment.attemptNumber;
    this.failureReason = payment.failureReason;
    this.processedAt = payment.processedAt;
    this.refundedAt = payment.refundedAt;
    this.createdAt = payment.createdAt;

    // Attach expanded reference details if loaded in entity query
    if (payment.booking) {
      this.bookingReference = payment.booking.bookingReference;
      if (payment.booking.property) {
        this.propertyTitle = payment.booking.property.title;
        this.propertyAddress = payment.booking.property.address;
        this.propertyCity = payment.booking.property.city;
        this.propertyState = payment.booking.property.state;
      }
      if (payment.booking.tenant) {
        this.tenantName = payment.booking.tenant.name;
        this.tenantEmail = payment.booking.tenant.email;
      }
    }
  }

  static fromEntity(payment) {
    if (!payment) return null;
    return new PaymentDTO(payment);
  }

  static fromEntities(payments) {
    if (!payments) return [];
    return payments.map(pay => PaymentDTO.fromEntity(pay));
  }
}
