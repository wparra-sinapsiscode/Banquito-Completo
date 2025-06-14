import React, { useState, useEffect } from 'react';
import { savingsService } from '../services';
import './SavingsPlan.css';

const SavingsPlan = ({ memberName, memberId, memberData, settings, onSavingsUpdate }) => {
  console.log('💰 SavingsPlan component mounted with props:', {
    memberName,
    memberId,
    memberData,
    settings
  });
  const [selectedPlan, setSelectedPlan] = useState(180);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calcular valor inicial basado en acciones del usuario
  const getInitialAmount = () => {
    if (memberData && memberData.shares && settings && settings.shareValue) {
      const shareValue = memberData.shares * settings.shareValue;
      return Math.max(shareValue, 100); // Mínimo 100
    }
    return 1000; // Valor por defecto si no tiene acciones
  };
  
  const [savingsAmount, setSavingsAmount] = useState(getInitialAmount().toString());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeSavings, setActiveSavings] = useState(null);
  const [existingPlanId, setExistingPlanId] = useState(null);
  
  const TASA_MENSUAL_COMPUESTA = 0.0191; // 1.91% mensual con interés compuesto

  // Cargar plan de ahorro existente al montar el componente
  useEffect(() => {
    if (memberId) {
      loadExistingSavingsPlan();
    }
  }, [memberId]);

  // Actualizar el monto inicial cuando cambien los datos del miembro
  useEffect(() => {
    if (!activeSavings && !isConfiguring) {
      setSavingsAmount(getInitialAmount().toString());
    }
  }, [memberData, settings]);

  const loadExistingSavingsPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await savingsService.getSavingsPlanByMemberId(memberId);
      
      console.log('🔍 Respuesta completa del servidor:', response);
      
      if (response && response.data) {
        const plan = response.data;
        console.log('🔍 Plan raw desde BD:', plan);
        console.log('🔍 initial_amount:', plan.initial_amount);
        console.log('🔍 enabled:', plan.enabled);
        console.log('🔍 status:', plan.status);
        // Si hay un plan activo con monto mayor a 0, mostrarlo
        if (plan.enabled) {
          const realAmount = parseFloat(plan.initial_amount); // Usar monto real de la BD
          
          // Solo mostrar como activo si tiene un monto real
          if (realAmount > 0) {
            const mappedPlan = {
              id: plan.id,
              memberId: plan.member_id,
              amount: realAmount, // Usar monto real de la BD
              plan: plan.plan_days,
              startDate: plan.start_date,
              endDate: calculateEndDate(plan.start_date, plan.plan_days),
              interest: calculateInterest(realAmount, plan.plan_days),
              totalAmount: realAmount + calculateInterest(realAmount, plan.plan_days),
              status: plan.status || 'active',
              TEN: TASA_MENSUAL_COMPUESTA
            };
            
            console.log('💰 Plan de ahorro cargado desde BD:', mappedPlan);
            setActiveSavings(mappedPlan);
            setSelectedPlan(plan.plan_days);
          } else {
            // Si existe un plan pero con amount = 0, permitir configuración
            console.log('⚠️ Plan existe pero con amount = 0, permitiendo configuración');
            setSelectedPlan(plan.plan_days);
            setExistingPlanId(plan.id); // Guardar ID para actualizar después
            // No establecer activeSavings para mostrar el formulario de configuración
          }
        }
      }
    } catch (error) {
      console.error('Error cargando plan de ahorro:', error);
      // Si es 404, no hay plan, lo cual está bien
      if (!error.message.includes('404')) {
        setError('Error al cargar el plan de ahorro');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (startDate, days) => {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return end.toISOString();
  };

  const plans = [
    { days: 90, months: 3, label: '90 DÍAS' },
    { days: 180, months: 6, label: '180 DÍAS' },
    { days: 365, months: 12, label: '365 DÍAS' }
  ];

  const calculateInterest = (amount, days) => {
    // Calcular número de meses según los días
    const months = days / 30;
    
    // Aplicar interés compuesto: Capital * (1 + tasa)^meses
    const finalAmount = amount * Math.pow(1 + TASA_MENSUAL_COMPUESTA, months);
    const interest = finalAmount - amount;
    
    return interest;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const currentPlan = plans.find(p => p.days === selectedPlan);
  const interest = savingsAmount ? calculateInterest(parseFloat(savingsAmount), selectedPlan) : 0;
  
  // Debug para verificar cálculos
  if (savingsAmount && parseFloat(savingsAmount) > 0) {
    console.log('💰 Cálculo de interés:', {
      monto: parseFloat(savingsAmount),
      días: selectedPlan,
      meses: selectedPlan / 30,
      tasaMensual: TASA_MENSUAL_COMPUESTA,
      tasaTotal: Math.pow(1 + TASA_MENSUAL_COMPUESTA, selectedPlan / 30) - 1,
      interés: interest
    });
  }
  
  const handleStartSaving = async () => {
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const savingData = {
        memberId,
        amount: parseFloat(savingsAmount),
        plan: selectedPlan,
        startDate: new Date().toISOString(),
        TEA: TASA_MENSUAL_COMPUESTA
      };
      
      let response;
      
      // Si existe un plan con ID, actualizarlo; si no, crear uno nuevo
      if (existingPlanId) {
        console.log('🔄 Actualizando plan existente con ID:', existingPlanId);
        // Para actualización, usar el formato del backend
        const updateData = {
          enabled: true,
          plan_days: selectedPlan,
          start_date: new Date().toISOString().split('T')[0],
          tea: 0.02,
          initial_amount: parseFloat(savingsAmount)
        };
        response = await savingsService.updateSavingsPlan(existingPlanId, updateData);
      } else {
        console.log('🆕 Creando nuevo plan de ahorro');
        response = await savingsService.createSavingsPlan(savingData);
      }
      
      if (response.success) {
        const createdPlan = response.data;
        const mappedPlan = {
          id: createdPlan.id,
          memberId: createdPlan.member_id,
          amount: parseFloat(savingsAmount),
          plan: createdPlan.plan_days,
          startDate: createdPlan.start_date,
          endDate: calculateEndDate(createdPlan.start_date, createdPlan.plan_days),
          interest: interest,
          totalAmount: parseFloat(savingsAmount) + interest,
          status: 'active',
          TEN: 0.02
        };
        
        setActiveSavings(mappedPlan);
        setIsConfiguring(false);
        setExistingPlanId(null); // Limpiar ID después de actualizar
        
        if (onSavingsUpdate) {
          onSavingsUpdate(mappedPlan);
        }
        
        const successMessage = existingPlanId ? 
          '¡Plan de ahorro actualizado exitosamente!' : 
          '¡Plan de ahorro creado exitosamente!';
        alert(successMessage);
        
        // Recargar los datos después de crear/actualizar
        setTimeout(() => {
          loadExistingSavingsPlan();
        }, 500);
      }
    } catch (error) {
      console.error('Error creando plan de ahorro:', error);
      setError(error.message || 'Error al crear el plan de ahorro');
      alert(error.message || 'Error al crear el plan de ahorro');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSavings = async () => {
    if (!activeSavings || !activeSavings.id) return;
    
    if (!window.confirm('¿Está seguro de que desea cancelar este plan de ahorro?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await savingsService.deleteSavingsPlan(activeSavings.id);
      
      setActiveSavings(null);
      setIsConfiguring(false);
      setExistingPlanId(null);
      
      if (onSavingsUpdate) {
        onSavingsUpdate(null);
      }
      
      alert('Plan de ahorro cancelado exitosamente');
      
      // Recargar los datos después de cancelar
      setTimeout(() => {
        loadExistingSavingsPlan();
      }, 500);
    } catch (error) {
      console.error('Error cancelando plan de ahorro:', error);
      setError(error.message || 'Error al cancelar el plan de ahorro');
      alert(error.message || 'Error al cancelar el plan de ahorro');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="savings-plan-container">
        <div className="savings-header">
          <h3>Plan de Ahorro Fijo - {memberName}</h3>
        </div>
        <div className="loading">Cargando plan de ahorro...</div>
      </div>
    );
  }

  return (
    <div className="savings-plan-container">
      <div className="savings-header">
        <h3>Plan de Ahorro Fijo - {memberName}</h3>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="savings-info">
        <p className="savings-subtitle">
          ¡Mientras más tiempo lo dejes, <strong>más ganarás</strong>!
        </p>
      </div>
      
      {!activeSavings && (
        <div className="amount-display">
          <div className="amount-label">Monto a depositar (dinero externo - solo simulación)</div>
          <div className="amount-note">
            💡 <em>Puedes modificar el monto para ver diferentes simulaciones</em>
          </div>
          <div className="shares-info">
            {memberData && memberData.shares ? (
              <small>
                💼 Valor de tus acciones: {memberData.shares} × S/ {settings?.shareValue || 500} = S/ {((memberData.shares || 0) * (settings?.shareValue || 500)).toLocaleString()}
              </small>
            ) : (
              <small>💼 No tienes acciones registradas</small>
            )}
          </div>
          {!isConfiguring ? (
            <div className="amount-config">
              <div className="current-amount-display">
                <span className="amount-prefix">Monto actual:</span>
                <span className="amount-value">S/ {parseFloat(savingsAmount).toLocaleString()}</span>
              </div>
              <button 
                className="config-btn"
                onClick={() => setIsConfiguring(true)}
                disabled={loading}
              >
                💰 Configurar monto de ahorro
              </button>
            </div>
          ) : (
            <div className="amount-input-container">
              <input
                type="number"
                className="amount-input"
                placeholder="Ingrese el monto"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                min="100"
                step="100"
              />

            </div>
          )}
        </div>
      )}
      
      {activeSavings && (
        <div className="active-savings-display">
          <h4>💰 Ahorro Activo</h4>
          <div className="savings-status">
            <div className="status-row">
              <span>Monto depositado:</span>
              <span>{formatCurrency(activeSavings.amount)}</span>
            </div>
            <div className="status-row">
              <span>Fecha de inicio:</span>
              <span>{new Date(activeSavings.startDate).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="status-row">
              <span>Fecha de vencimiento:</span>
              <span>{new Date(activeSavings.endDate).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="status-row highlight">
              <span>Total al vencimiento:</span>
              <span>{formatCurrency(activeSavings.totalAmount)}</span>
            </div>
          </div>
          <button 
            className="cancel-saving-btn"
            onClick={handleCancelSavings}
            disabled={loading}
          >
            ❌ Cancelar Plan de Ahorro
          </button>
        </div>
      )}
      
      {!activeSavings && savingsAmount && parseFloat(savingsAmount) > 0 && (
      <div className="plan-selector">
        <p className="selector-label">Escoge el plazo de tu depósito</p>
        <div className="plan-options">
          {plans.map((plan) => (
            <div
              key={plan.days}
              className={`plan-option ${selectedPlan === plan.days ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.days)}
            >
              <div className="plan-days">{plan.label}</div>
              <div className="plan-months">{plan.months} meses</div>
            </div>
          ))}
        </div>
      </div>
      )}
      
      {!activeSavings && savingsAmount && parseFloat(savingsAmount) > 0 && (
      <div className="savings-result">
        <div className="result-card selected">
          <div className="result-details">
            <div className="detail-row">
              <span className="detail-label">DÍAS</span>
              <span className="detail-value">{selectedPlan}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">MONTO</span>
              <span className="detail-value">{formatCurrency(savingsAmount)}</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">GANARÍAS</span>
              <span className="detail-value interest">{formatCurrency(interest.toFixed(2))}</span>
            </div>
            <div className="detail-row total">
              <span className="detail-label">TOTAL AL VENCIMIENTO</span>
              <span className="detail-value">{formatCurrency(parseFloat(savingsAmount) + parseFloat(interest))}</span>
            </div>
          </div>
          </div>
          <button 
            className="start-saving-btn"
            onClick={handleStartSaving}
            disabled={loading}
          >
            🚀 Iniciar Plan de Ahorro
          </button>
        </div>
      )}
      
      {!activeSavings && (
      <button 
        className="view-more-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Ver menos' : 'Ver más'} ▼
      </button>
      )}
      
      {showDetails && !activeSavings && (
        <div className="additional-info">
          <p className="info-text">
            La Tasa de Rendimiento Efectivo Anual (TREA) es igual a la Tasa Efectiva Anual (TEA).
          </p>
          <p className="info-text">
            Este plan de ahorro está diseñado para hacer crecer tu dinero con un interés del 2% TEA.
            <strong> El dinero depositado aquí es totalmente externo y no afecta tus acciones ni el capital del grupo.</strong>
          </p>
          <div className="formula-info">
            <h5>📊 Fórmula de cálculo:</h5>
            <p>TEM = (1 + TEA)^(1/12) - 1</p>
            <p>TEM mensual = {((Math.pow(1 + 0.02, 1/12) - 1) * 100).toFixed(4)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsPlan;