import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import authService from './services/authService';
import systemService from './services/systemService';
import loanService from './services/loanService';
import memberService from './services/memberService';
import loanRequestService from './services/loanRequestService';
import { initialLoans, initialLoanRequests } from './data/mockDataFinal';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loanRequests, setLoanRequests] = useState(initialLoanRequests);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState({
    shareValue: 500,
    loanLimits: {
      individual: 8000,
      guaranteePercentage: 80
    },
    monthlyInterestRates: {
      high: 3, // >5000 - 3% mensual
      medium: 5, // 1000-5000 - 5% mensual
      low: 10 // <1000 - 10% mensual
    },
    operationDay: 'wednesday',
    delinquencyRate: 5.0 // Tasa de recargo por mora única en porcentaje
  });

  // Cargar datos iniciales al cargar la app
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar configuraciones desde la base de datos
        console.log('🔧 Cargando configuraciones del sistema...');
        const systemSettings = await systemService.getSettings();
        console.log('✅ Configuraciones cargadas:', systemSettings);
        console.log('📊 Tipo de configuraciones:', typeof systemSettings);
        console.log('🔍 Claves disponibles:', systemSettings ? Object.keys(systemSettings) : 'No hay claves');
        
        // Solo actualizar settings si recibimos datos válidos
        if (systemSettings && typeof systemSettings === 'object' && Object.keys(systemSettings).length > 0) {
          console.log('✅ Aplicando configuraciones del servidor');
          setSettings(systemSettings);
        } else {
          console.log('⚠️ Configuraciones inválidas o vacías, usando valores por defecto');
          console.log('📝 Configuraciones por defecto mantenidas');
        }
      } catch (error) {
        console.error('❌ Error cargando configuraciones del sistema:', error);
        console.log('📝 Usando configuraciones por defecto');
        // Mantener configuraciones por defecto si falla la carga
      }

      // Verificar si hay una sesión activa
      const savedUser = authService.getCurrentUser();
      if (savedUser && authService.isAuthenticated()) {
        setCurrentUser(savedUser);
        
        // Cargar miembros desde la base de datos
        try {
          console.log('👥 Cargando miembros desde la base de datos...');
          const membersData = await memberService.getMembers();
          console.log('✅ Miembros cargados:', membersData);
          
          if (Array.isArray(membersData) && membersData.length > 0) {
            setMembers(membersData);
            console.log('📊 Total miembros cargados:', membersData.length);
          } else {
            console.log('⚠️ No hay miembros en la base de datos');
          }
        } catch (error) {
          console.error('❌ Error cargando miembros:', error);
        }
        
        // Cargar préstamos desde la base de datos solo si hay usuario autenticado
        try {
          console.log('💰 Cargando préstamos desde la base de datos...');
          const loansData = await loanService.getLoans();
          console.log('✅ Préstamos cargados:', loansData);
          
          if (Array.isArray(loansData) && loansData.length > 0) {
            setLoans(loansData);
            console.log('📊 Total préstamos cargados:', loansData.length);
          } else {
            console.log('📝 No hay préstamos en la base de datos, usando datos de ejemplo');
            setLoans(initialLoans); // Fallback a datos mock si no hay préstamos
          }
        } catch (error) {
          console.error('❌ Error cargando préstamos:', error);
          console.log('📝 Usando datos de ejemplo debido al error');
          setLoans(initialLoans); // Fallback a datos mock en caso de error
        }
        
        // Cargar solicitudes de préstamo desde la base de datos
        try {
          console.log('📋 Cargando solicitudes de préstamo desde la base de datos...');
          const loanRequestsData = await loanRequestService.getLoanRequests();
          console.log('✅ Solicitudes de préstamo cargadas:', loanRequestsData);
          
          if (Array.isArray(loanRequestsData) && loanRequestsData.length > 0) {
            setLoanRequests(loanRequestsData);
            console.log('📊 Total solicitudes cargadas:', loanRequestsData.length);
          } else {
            console.log('⚠️ No hay solicitudes de préstamo en la base de datos');
            setLoanRequests([]);
          }
        } catch (error) {
          console.error('❌ Error cargando solicitudes de préstamo:', error);
          setLoanRequests([]);
        }
      }
    };

    loadInitialData();
  }, []);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    
    // Cargar miembros después del login
    try {
      const membersData = await memberService.getMembers();
      
      if (Array.isArray(membersData) && membersData.length > 0) {
        setMembers(membersData);
      }
    } catch (error) {
      console.error('❌ Error cargando miembros después del login:', error);
    }
    
    // Cargar préstamos después del login
    try {
      const loansData = await loanService.getLoans();
      
      if (Array.isArray(loansData) && loansData.length > 0) {
        setLoans(loansData);
      } else {
        setLoans(initialLoans);
      }
    } catch (error) {
      console.error('❌ Error cargando préstamos después del login:', error);
      console.log('📝 Usando datos de ejemplo debido al error');
      setLoans(initialLoans);
    }
    
    // Cargar solicitudes de préstamo después del login
    try {
      console.log('📋 Cargando solicitudes de préstamo después del login...');
      const loanRequestsData = await loanRequestService.getLoanRequests();
      console.log('✅ Solicitudes de préstamo cargadas después del login:', loanRequestsData);
      
      if (Array.isArray(loanRequestsData) && loanRequestsData.length > 0) {
        setLoanRequests(loanRequestsData);
        console.log('📊 Total solicitudes cargadas:', loanRequestsData.length);
      } else {
        console.log('⚠️ No hay solicitudes de préstamo en la base de datos');
        setLoanRequests([]);
      }
    } catch (error) {
      console.error('❌ Error cargando solicitudes de préstamo después del login:', error);
      setLoanRequests([]);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al hacer logout:', error);
    }
    setCurrentUser(null);
  };

  const calculateBaseCapital = () => {
    // Capital Base = Suma de todas las acciones × valor por acción
    const shareValue = settings?.shareValue || 500;
    const totalShares = members.reduce((sum, member) => sum + (member.shares || 0), 0);
    
    console.log('💰 Cálculo Capital Base:', {
      miembros: members.length,
      accionesTotales: totalShares,
      valorPorAccion: shareValue,
      capitalBase: totalShares * shareValue,
      detallesMiembros: members.map(m => ({ nombre: m.name, acciones: m.shares || 0 }))
    });
    
    return totalShares * shareValue;
  };

  const calculateTotalCapital = () => {
    // En el modelo de Banquito, el capital total es simplemente el capital base (garantías)
    // Los intereses y comisiones son ganancias, no capital
    return calculateBaseCapital();
  };

  const calculateAvailableCapital = () => {
    // En el modelo de Banquito: Capital Disponible = Capital Base - Préstamos Activos
    const baseCapital = calculateBaseCapital();
    const loanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => {
        let remaining = parseFloat(loan.remainingAmount || 0);
        
        // Si el remaining amount es 0 pero el préstamo no está pagado, recalcular
        if (remaining === 0 && loan.status !== 'paid') {
          // Calcular el total con intereses
          const originalAmount = parseFloat(loan.originalAmount || 0);
          const monthlyInterestRate = parseFloat(loan.monthlyInterestRate || 0);
          const totalWeeks = parseInt(loan.totalWeeks || loan.installments || 0);
          
          let totalAmountWithInterest = originalAmount;
          if (monthlyInterestRate > 0 && totalWeeks > 0) {
            const totalMonths = Math.ceil(totalWeeks / 4);
            const TEM = monthlyInterestRate / 100;
            const potencia = Math.pow(1 + TEM, totalMonths);
            const monthlyPayment = originalAmount * (TEM * potencia) / (potencia - 1);
            totalAmountWithInterest = monthlyPayment * totalMonths;
          } else if (loan.weeklyPayment && totalWeeks > 0) {
            totalAmountWithInterest = loan.weeklyPayment * totalWeeks;
          }
          
          // Calcular lo pagado (parseFloat para evitar concatenación de strings)
          const frontendPaid = (loan.paymentHistory || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
          const backendPaid = (loan._backend?.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
          const totalPaid = Math.max(frontendPaid, backendPaid);
          remaining = Math.max(0, totalAmountWithInterest - totalPaid);
        }
        
        return total + remaining;
      }, 0);
    // CORRECCIÓN: Usar capital base, no capital total con intereses
    return baseCapital - loanedAmount;
  };

  // Nueva función para obtener estadísticas bancarias adicionales
  const getBankingStatistics = () => {
    console.log('🔍 getBankingStatistics - Iniciando cálculo de estadísticas');
    console.log('📊 Préstamos disponibles:', loans.length);
    console.log('📊 Préstamos activos:', loans.filter(loan => loan.status !== 'paid').length);
    
    const baseCapital = calculateBaseCapital();
    const totalCapital = calculateTotalCapital();
    const availableCapital = calculateAvailableCapital();
    
    // Extraer los componentes del capital total
    const totalInterestEarned = loans.reduce((total, loan) => {
      if (!loan.originalAmount || !loan.weeklyPayment || !loan.totalWeeks) return total;
      
      const originalAmount = parseFloat(loan.originalAmount) || 0;
      const weeklyPayment = parseFloat(loan.weeklyPayment) || 0;
      const totalWeeks = parseInt(loan.totalWeeks || loan.installments) || 0;
      
      // Total con intereses - Total sin intereses = Intereses totales
      const totalWithInterest = weeklyPayment * totalWeeks;
      const totalInterest = totalWithInterest - originalAmount;
      
      if (loan.status === 'paid') {
        // Si está pagado, todos los intereses fueron cobrados
        return total + totalInterest;
      } else {
        // Si no está pagado, calcular intereses proporcionales a los pagos realizados
        const paymentsCount = (loan.paymentHistory || []).length;
        const backendPaymentsCount = (loan._backend?.payments || []).length;
        const actualPayments = Math.max(paymentsCount, backendPaymentsCount);
        const interestPerPayment = totalInterest / totalWeeks;
        return total + (interestPerPayment * actualPayments);
      }
    }, 0);
    
    const totalCommissions = loans.reduce((total, loan) => {
      return total + (loan.originalAmount * 0.02);
    }, 0);
    
    const totalLateFees = loans.reduce((total, loan) => {
      return total + (loan.paymentHistory || []).reduce((sum, payment) => {
        return sum + (payment.lateFee || 0);
      }, 0);
    }, 0);
    
    // Debugging prestamos activos
    console.log('🔍 Calculando préstamos activos...');
    const activeLoans = loans.filter(loan => loan.status !== 'paid');
    activeLoans.forEach(loan => {
      console.log(`📋 Préstamo ID ${loan.id}:`, {
        memberId: loan.memberId,
        memberName: loan.memberName,
        status: loan.status,
        originalAmount: loan.originalAmount,
        remainingAmount: loan.remainingAmount,
        weeklyPayment: loan.weeklyPayment,
        totalWeeks: loan.totalWeeks,
        payments: loan.paymentHistory?.length || 0
      });
    });
    
    const loanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => {
        let remaining = parseFloat(loan.remainingAmount || 0);
        
        // Si el remaining amount es 0 pero el préstamo no está pagado, recalcular
        if (remaining === 0 && loan.status !== 'paid') {
          console.log(`⚠️ Préstamo ${loan.id} tiene saldo 0 pero no está pagado. Recalculando...`);
          
          // Calcular el total con intereses
          const originalAmount = parseFloat(loan.originalAmount || 0);
          const monthlyInterestRate = parseFloat(loan.monthlyInterestRate || 0);
          const totalWeeks = parseInt(loan.totalWeeks || loan.installments || 0);
          
          let totalAmountWithInterest = originalAmount;
          if (monthlyInterestRate > 0 && totalWeeks > 0) {
            const totalMonths = Math.ceil(totalWeeks / 4);
            const TEM = monthlyInterestRate / 100;
            const potencia = Math.pow(1 + TEM, totalMonths);
            const monthlyPayment = originalAmount * (TEM * potencia) / (potencia - 1);
            totalAmountWithInterest = monthlyPayment * totalMonths;
          } else if (loan.weeklyPayment && totalWeeks > 0) {
            totalAmountWithInterest = loan.weeklyPayment * totalWeeks;
          }
          
          // Calcular lo pagado (parseFloat para evitar concatenación de strings)
          const frontendPaid = (loan.paymentHistory || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
          const backendPaid = (loan._backend?.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
          const totalPaid = Math.max(frontendPaid, backendPaid);
          remaining = Math.max(0, totalAmountWithInterest - totalPaid);
          
          console.log(`💡 Recalculado - Total con intereses: ${totalAmountWithInterest}, Pagado: ${totalPaid}, Pendiente: ${remaining}`);
        }
        
        console.log(`💰 Préstamo ${loan.id} - Saldo pendiente: ${remaining}`);
        return total + remaining;
      }, 0);
    
    console.log('📊 Total prestado actualmente:', loanedAmount);
    
    const totalShares = members.reduce((sum, member) => sum + (member.shares || 0), 0);
    const activeLoanCount = loans.filter(loan => loan.status !== 'paid').length;
    const totalLoanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => total + parseFloat(loan.originalAmount || 0), 0);
    const totalPaidAmount = loans.reduce((total, loan) => {
      const frontendPaid = (loan.paymentHistory || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      const backendPaid = (loan._backend?.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      return total + Math.max(frontendPaid, backendPaid);
    }, 0);
    
    // Calcular total de préstamos originales (para estadísticas de recuperación)
    const totalOriginalAmount = loans.reduce((total, loan) => 
      total + parseFloat(loan.originalAmount || 0), 0
    );
    
    // Calcular pendiente de cobro basado en monto total con intereses menos pagado
    const totalPendingCollection = loans.reduce((total, loan) => {
      if (loan.status === 'paid') return total;
      
      // Calcular monto total con intereses
      const originalAmount = parseFloat(loan.originalAmount || 0);
      const monthlyInterestRate = parseFloat(loan.monthlyInterestRate || 0);
      const totalWeeks = parseInt(loan.totalWeeks || loan.installments || 0);
      
      let totalAmountWithInterest = originalAmount;
      if (monthlyInterestRate > 0 && totalWeeks > 0) {
        const totalMonths = Math.ceil(totalWeeks / 4);
        const TEM = monthlyInterestRate / 100;
        const potencia = Math.pow(1 + TEM, totalMonths);
        const monthlyPayment = originalAmount * (TEM * potencia) / (potencia - 1);
        totalAmountWithInterest = monthlyPayment * totalMonths;
      }
      
      // Calcular lo ya pagado para este préstamo
      const paidAmount = (loan.paymentHistory || []).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      return total + Math.max(0, totalAmountWithInterest - paidAmount);
    }, 0);
    
    // Calcular tasa de recuperación
    const recoveryRate = totalOriginalAmount > 0 ? (totalPaidAmount / totalOriginalAmount) * 100 : 0;
    
    return {
      totalCapital,
      availableCapital,
      baseCapital,
      totalInterestEarned,
      totalCommissions,
      totalLateFees,
      loanedCapital: loanedAmount,
      capitalUtilization: baseCapital > 0 ? ((loanedAmount / baseCapital) * 100).toFixed(1) : '0',
      totalShares,
      shareValue: settings?.shareValue || 500,
      memberCount: members.length,
      activeLoanCount,
      totalLoanedAmount,
      totalPaidAmount,
      averageLoanAmount: activeLoanCount > 0 ? Math.round(totalLoanedAmount / activeLoanCount) : 0,
      profitMargin: baseCapital > 0 ? (((totalInterestEarned + totalCommissions + totalLateFees) / baseCapital) * 100).toFixed(2) : '0'
    };
  };

  const getMonthlyInterestRate = (amount) => {
    if (!settings?.monthlyInterestRates) {
      // Fallback values if monthlyInterestRates is undefined
      if (amount > 5000) return 3;
      if (amount > 1000) return 5;
      return 10;
    }
    if (amount > 5000) return settings.monthlyInterestRates.high;
    if (amount > 1000) return settings.monthlyInterestRates.medium;
    return settings.monthlyInterestRates.low;
  };

  const calculateLateFee = (originalPayment, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today <= due) return 0; // No hay mora si no está vencido
    
    // Calcular semanas de atraso
    const weeksLate = Math.ceil((today - due) / (7 * 24 * 60 * 60 * 1000));
    
    // 5% de mora por cada semana de atraso
    const lateFeePercentage = weeksLate * (settings.delinquencyRate / 100);
    const lateFee = originalPayment * lateFeePercentage;
    
    return Math.round(lateFee * 100) / 100;
  };

  const getPaymentWithLateFee = (loan) => {
    const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment;
    const lateFee = calculateLateFee(weeklyPayment, loan.dueDate);
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysLate = lateFee > 0 ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    const weeksLate = lateFee > 0 ? Math.ceil((today - dueDate) / (7 * 24 * 60 * 60 * 1000)) : 0;
    
    return {
      originalPayment: weeklyPayment,
      lateFee: lateFee,
      totalPayment: weeklyPayment + lateFee,
      daysLate: daysLate,
      weeksLate: weeksLate,
      isOverdue: lateFee > 0
    };
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Header user={currentUser} onLogout={handleLogout} />
      <Dashboard 
        user={currentUser}
        loans={loans}
        setLoans={setLoans}
        loanRequests={loanRequests}
        setLoanRequests={setLoanRequests}
        members={members}
        setMembers={setMembers}
        settings={settings}
        setSettings={setSettings}
        calculateTotalCapital={calculateTotalCapital}
        calculateAvailableCapital={calculateAvailableCapital}
        getBankingStatistics={getBankingStatistics}
        getMonthlyInterestRate={getMonthlyInterestRate}
        calculateLateFee={calculateLateFee}
        getPaymentWithLateFee={getPaymentWithLateFee}
      />
    </div>
  );
}

export default App;