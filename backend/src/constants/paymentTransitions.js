import { PAYMENT_STATUS } from "./paymentStatus.js";

export const ALLOWED_PAYMENT_TRANSITIONS = {
  [PAYMENT_STATUS.PENDING]: [PAYMENT_STATUS.SUCCEEDED, PAYMENT_STATUS.FAILED],
  [PAYMENT_STATUS.SUCCEEDED]: [PAYMENT_STATUS.REFUNDED],
  [PAYMENT_STATUS.FAILED]: [],
  [PAYMENT_STATUS.REFUNDED]: []
};

/**
 * Validates if a payment status transition is legally permitted
 * @param {string} currentStatus - Existing status in DB
 * @param {string} nextStatus - Proposed next status
 * @returns {boolean} - True if transition is valid
 */
export const isValidPaymentTransition = (currentStatus, nextStatus) => {
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
};
