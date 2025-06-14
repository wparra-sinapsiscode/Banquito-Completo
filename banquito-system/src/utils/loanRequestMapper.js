// Mapeo de datos para solicitudes de préstamo

export const mapLoanRequestFromBackend = (backendRequest) => {
  if (!backendRequest) return null;
  
  return {
    id: backendRequest.id,
    memberId: backendRequest.member_id,
    memberName: backendRequest.member?.name || 'N/A',
    requestedAmount: parseFloat(backendRequest.requested_amount || 0),
    purpose: backendRequest.purpose,
    installments: backendRequest.installments,
    totalWeeks: backendRequest.total_weeks,
    weeklyPayment: parseFloat(backendRequest.weekly_payment || 0),
    monthlyPayment: parseFloat(backendRequest.monthly_payment || 0),
    monthlyInterestRate: parseFloat(backendRequest.monthly_interest_rate || 0),
    totalInterest: parseFloat(backendRequest.total_interest || 0),
    totalAmount: parseFloat(backendRequest.total_amount || 0),
    status: backendRequest.status,
    approvedBy: backendRequest.approved_by,
    rejectedBy: backendRequest.rejected_by,
    rejectionReason: backendRequest.rejection_reason,
    requestDate: backendRequest.request_date,
    approvalDate: backendRequest.approval_date,
    rejectionDate: backendRequest.rejection_date,
    requiredDate: backendRequest.required_date
  };
};

export const mapLoanRequestToBackend = (frontendRequest) => {
  return {
    member_id: frontendRequest.memberId,
    requested_amount: frontendRequest.requestedAmount,
    purpose: frontendRequest.purpose,
    installments: frontendRequest.installments,
    total_weeks: frontendRequest.totalWeeks,
    weekly_payment: frontendRequest.weeklyPayment,
    monthly_payment: frontendRequest.monthlyPayment,
    monthly_interest_rate: frontendRequest.monthlyInterestRate,
    total_interest: frontendRequest.totalInterest,
    total_amount: frontendRequest.totalAmount
  };
};