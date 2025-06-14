class CalculationService {
  calculateLoanPayment(amount, monthlyInterestRate, totalWeeks) {
    const totalMonths = Math.ceil(totalWeeks / 4);
    const TEM = monthlyInterestRate / 100;
    
    console.log('🧮 CalculationService - Entrada:', {
      amount,
      monthlyInterestRate,
      totalWeeks,
      totalMonths,
      TEM
    });
    
    if (TEM === 0) {
      const monthlyPayment = amount / totalMonths;
      const weeklyPayment = monthlyPayment / 4;
      
      return {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        weeklyPayment: Math.ceil(weeklyPayment),
        totalInterest: 0,
        totalAmount: amount,
        totalMonths: totalMonths,
        weeklyCapital: Math.round((amount / totalWeeks) * 100) / 100
      };
    }
    
    const potencia = Math.pow(1 + TEM, totalMonths);
    const monthlyPayment = amount * (TEM * potencia) / (potencia - 1);
    const weeklyPayment = monthlyPayment / 4;
    const totalAmount = monthlyPayment * totalMonths;
    const totalInterest = totalAmount - amount;
    
    console.log('🧮 CalculationService - Cálculos intermedios:', {
      potencia,
      monthlyPayment,
      weeklyPayment,
      totalAmount,
      totalInterest
    });
    
    const result = {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      weeklyPayment: Math.ceil(weeklyPayment),
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalMonths: totalMonths,
      weeklyCapital: Math.round((amount / totalWeeks) * 100) / 100
    };
    
    console.log('✅ CalculationService - Resultado final:', result);
    
    return result;
  }
  
  getMonthlyInterestRate(amount, settings) {
    if (amount > 5000) return settings.monthlyInterestRates?.high || 3;
    if (amount > 1000) return settings.monthlyInterestRates?.medium || 5;
    return settings.monthlyInterestRates?.low || 10;
  }
  
  calculateLateFee(originalPayment, dueDate, delinquencyRate = 5.0) {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today <= due) return 0;
    
    // Validar que originalPayment sea un número válido
    const payment = parseFloat(originalPayment);
    if (isNaN(payment) || payment <= 0) return 0;
    
    const weeksLate = Math.ceil((today - due) / (7 * 24 * 60 * 60 * 1000));
    const lateFeePercentage = weeksLate * (delinquencyRate / 100);
    const lateFee = payment * lateFeePercentage;
    
    return Math.round(lateFee * 100) / 100;
  }
  
  getNextWednesday(date) {
    let d;
    if (typeof date === 'string' && date.includes('-')) {
      const [year, month, day] = date.split('T')[0].split('-').map(Number);
      d = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      d = new Date(date);
    }
    
    const dayOfWeek = d.getDay();
    
    let daysToAdd;
    if (dayOfWeek === 3) {
      daysToAdd = 7;
    } else if (dayOfWeek < 3) {
      daysToAdd = 3 - dayOfWeek;
    } else {
      daysToAdd = 10 - dayOfWeek;
    }
    
    d.setDate(d.getDate() + daysToAdd);
    return d;
  }
  
  generatePaymentSchedule(loanAmount, totalWeeks, monthlyInterestRate, startDate) {
    const calculation = this.calculateLoanPayment(loanAmount, monthlyInterestRate, totalWeeks);
    const schedule = [];
    let remainingBalance = loanAmount;
    
    let currentDate;
    if (typeof startDate === 'string' && startDate.includes('-')) {
      const [year, month, day] = startDate.split('T')[0].split('-').map(Number);
      currentDate = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      currentDate = new Date(startDate);
    }
    
    for (let i = 1; i <= totalWeeks; i++) {
      let wednesdayDate;
      
      if (i === 1) {
        // Para la primera semana, encontrar el próximo miércoles desde la fecha de inicio
        wednesdayDate = this.getNextWednesday(currentDate);
      } else {
        // Para las semanas siguientes, simplemente sumar 7 días (siguiente miércoles)
        currentDate.setDate(currentDate.getDate() + 7);
        wednesdayDate = new Date(currentDate);
      }
      
      remainingBalance -= calculation.weeklyCapital;
      
      schedule.push({
        week: i,
        dueDate: wednesdayDate.toISOString().split('T')[0],
        weeklyPayment: calculation.weeklyPayment,
        capitalPayment: calculation.weeklyCapital,
        interestPayment: calculation.weeklyPayment - calculation.weeklyCapital,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
        status: 'pending'
      });
      
      currentDate = new Date(wednesdayDate);
    }
    
    return schedule;
  }
  
  calculateAmortizationSchedule(amount, monthlyInterestRate, totalMonths) {
    const TEM = monthlyInterestRate / 100;
    const schedule = [];
    let remainingBalance = amount;
    
    if (TEM === 0) {
      const monthlyCapital = amount / totalMonths;
      for (let i = 1; i <= totalMonths; i++) {
        schedule.push({
          month: i,
          payment: monthlyCapital,
          interest: 0,
          capital: monthlyCapital,
          balance: Math.round((remainingBalance - monthlyCapital) * 100) / 100
        });
        remainingBalance -= monthlyCapital;
      }
      return schedule;
    }
    
    const potencia = Math.pow(1 + TEM, totalMonths);
    const monthlyPayment = amount * (TEM * potencia) / (potencia - 1);
    
    for (let i = 1; i <= totalMonths; i++) {
      const interest = remainingBalance * TEM;
      const capital = monthlyPayment - interest;
      remainingBalance -= capital;
      
      schedule.push({
        month: i,
        payment: Math.round(monthlyPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        capital: Math.round(capital * 100) / 100,
        balance: Math.round(Math.max(0, remainingBalance) * 100) / 100
      });
    }
    
    return schedule;
  }
  
  calculateBankingStatistics(members, loans, settings) {
    const shareValue = settings.shareValue || 500;
    
    const baseCapital = members.reduce((total, member) => 
      total + (member.shares * shareValue), 0
    );
    
    const totalInterestEarned = loans.reduce((total, loan) => {
      const calculation = this.calculateLoanPayment(
        loan.original_amount,
        loan.monthly_interest_rate,
        loan.total_weeks || loan.installments
      );
      
      const totalPaid = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const paidInterest = Math.min(totalPaid - loan.original_amount, calculation.totalInterest);
      
      const pendingInterest = (() => {
        if (loan.status === 'paid') return 0;
        return Math.max(0, calculation.totalInterest - Math.max(0, paidInterest));
      })();
      
      return total + Math.max(0, paidInterest) + pendingInterest;
    }, 0);
    
    const totalCommissions = loans.reduce((total, loan) => 
      total + (loan.original_amount * 0.02), 0
    );
    
    const totalLateFees = loans.reduce((total, loan) => 
      total + (loan.payments?.reduce((sum, payment) => 
        sum + (payment.late_fee || 0), 0) || 0), 0
    );
    
    const loanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => {
        // Calcular saldo pendiente correcto
        const calculation = this.calculateLoanPayment(
          loan.original_amount,
          loan.monthly_interest_rate,
          loan.total_weeks || loan.installments
        );
        const totalPaid = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const remainingAmount = Math.max(0, calculation.totalAmount - totalPaid);
        return total + remainingAmount;
      }, 0);
    
    const totalCapital = baseCapital + totalInterestEarned + totalCommissions + totalLateFees;
    const availableCapital = totalCapital - loanedAmount;
    
    const totalShares = members.reduce((total, member) => total + member.shares, 0);
    const activeLoanCount = loans.filter(loan => loan.status !== 'paid').length;
    const totalLoanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => total + loan.original_amount, 0);
    const totalPaidAmount = loans.reduce((total, loan) => 
      total + (loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0), 0
    );
    
    return {
      totalCapital,
      availableCapital,
      baseCapital,
      totalInterestEarned,
      totalCommissions,
      totalLateFees,
      loanedCapital: loanedAmount,
      capitalUtilization: totalCapital > 0 ? ((loanedAmount / totalCapital) * 100).toFixed(1) : '0',
      totalShares,
      shareValue,
      memberCount: members.length,
      activeLoanCount,
      totalLoanedAmount,
      totalPaidAmount,
      averageLoanAmount: activeLoanCount > 0 ? Math.round(totalLoanedAmount / activeLoanCount) : 0,
      profitMargin: baseCapital > 0 ? (((totalInterestEarned + totalCommissions + totalLateFees) / baseCapital) * 100).toFixed(2) : '0'
    };
  }
}

module.exports = new CalculationService();