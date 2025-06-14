import React, { useState, useEffect } from 'react';
import './MembersTable.css';
import SavingsPlan from './SavingsPlan';
import memberService from '../services/memberService';
import { importFromExcel } from '../utils/excelUtils';
import { generateExcelWithColors } from '../utils/excelColorExport';

const MembersTable = ({ settings, darkMode }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [viewingSavingsPlan, setViewingSavingsPlan] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    dni: '',
    shares: 10,
    phone: '',
    email: '',
    credit_rating: 'yellow',
    credit_score: 50,
    username: '',
    password: ''
  });

  // Cargar miembros al montar el componente
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando miembros...');
      const data = await memberService.getMembers();
      console.log('✅ Miembros cargados:', data);
      // Filtrar cualquier valor undefined o null
      const validMembers = (data || []).filter(member => member && member.id);
      setMembers(validMembers);
    } catch (error) {
      console.error('❌ Error cargando miembros:', error);
      setError('Error al cargar miembros: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember({ 
      ...member,
      username: member.username || '',
      password: member.password || ''
    });
  };

  const handleSaveMember = async () => {
    try {
      const updatedMember = await memberService.updateMember(editingMember.id, editingMember);
      setMembers(prev => prev.map(member => 
        member.id === editingMember.id ? updatedMember : member
      ));
      setEditingMember(null);
    } catch (error) {
      console.error('Error actualizando miembro:', error);
      alert('Error al actualizar miembro: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
  };

  const handleAddMember = async () => {
    // Validaciones básicas
    if (!newMember.name || !newMember.dni) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Validar longitud del DNI
    if (newMember.dni.length < 8 || newMember.dni.length > 20) {
      alert('El DNI debe tener entre 8 y 20 caracteres');
      return;
    }
    
    // Validar que el DNI solo contenga números
    if (!/^\d+$/.test(newMember.dni)) {
      alert('El DNI debe contener solo números');
      return;
    }
    
    // Validar credenciales si se proporcionan
    if (newMember.username && !newMember.password) {
      alert('Si proporciona un nombre de usuario, también debe proporcionar una contraseña');
      return;
    }

    try {
      // Crear nuevo miembro con plan de ahorro opcional
      const memberData = {
        name: newMember.name,
        dni: newMember.dni,
        shares: newMember.shares || 10,
        guarantee: (newMember.shares || 10) * (settings?.shareValue || 800), // Calcular garantía
        phone: newMember.phone,
        email: newMember.email,
        credit_rating: newMember.credit_rating || 'yellow',
        credit_score: newMember.credit_score || 50,
        username: newMember.username, // Agregar credenciales
        password: newMember.password, // Agregar credenciales
        savingsPlan: {
          enabled: true,
          planDays: 180,
          startDate: new Date().toISOString().split('T')[0],
          TEA: 0.02
        }
      };
      
      console.log('📤 Enviando datos de miembro:', memberData);
      console.log('🔑 Username:', memberData.username ? 'Sí' : 'No');
      console.log('🔐 Password:', memberData.password ? 'Sí' : 'No');

      const createdMember = await memberService.createMember(memberData);
      
      // Validar que el miembro fue creado correctamente
      if (createdMember && createdMember.id) {
        // Actualizar lista de miembros
        setMembers(prev => [...prev.filter(m => m && m.id), createdMember]);
      } else {
        // Si no se recibió un miembro válido, recargar la lista
        await loadMembers();
      }

      // Limpiar formulario y cerrar modal
      setNewMember({
        name: '',
        dni: '',
        shares: 10,
        phone: '',
        email: '',
        credit_rating: 'yellow',
        credit_score: 50,
        username: '',
        password: ''
      });
      setShowAddMemberModal(false);

      alert('Miembro creado exitosamente');
    } catch (error) {
      console.error('Error creando miembro:', error);
      alert('Error al crear miembro: ' + error.message);
    }
  };

  const handleCancelAddMember = () => {
    setNewMember({
      name: '',
      dni: '',
      shares: 10,
      phone: '',
      email: '',
      credit_rating: 'yellow',
      credit_score: 50,
      username: '',
      password: ''
    });
    setShowAddMemberModal(false);
  };

  const handleDeleteMember = async (memberId, memberName) => {
    const confirmation = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${memberName}?\n\n` +
      `Esta acción eliminará al miembro y su usuario asociado del sistema.\n\n` +
      `Esta acción NO se puede deshacer.`
    );

    if (confirmation) {
      try {
        await memberService.deleteMember(memberId);
        setMembers(prev => prev.filter(m => m.id !== memberId));
        alert(`Miembro "${memberName}" eliminado exitosamente.`);
      } catch (error) {
        console.error('Error eliminando miembro:', error);
        alert('Error al eliminar miembro: ' + error.message);
      }
    }
  };

  const updateCreditRating = async (memberId, newRating) => {
    // Calcular nuevo puntaje crediticio basado en la evaluación
    const getScoreFromRating = (rating) => {
      switch(rating) {
        case 'green': return Math.floor(Math.random() * 21) + 70; // 70-90 (Verde/Excelente)
        case 'yellow': return Math.floor(Math.random() * 30) + 40; // 40-69 (Amarillo/Regular)
        case 'red': return Math.floor(Math.random() * 40); // 0-39 (Rojo/Riesgo)
        default: return 90;
      }
    };

    const newCreditScore = getScoreFromRating(newRating);

    console.log('🔄 updateCreditRating - Cambiando calificación:', {
      memberId,
      newRating,
      newCreditScore
    });

    try {
      const updateData = {
        credit_rating: newRating,
        credit_score: newCreditScore
      };

      console.log('📤 Enviando actualización al backend:', updateData);
      const result = await memberService.updateMember(memberId, updateData);
      console.log('✅ Respuesta del backend:', result);
      
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { 
          ...member, 
          credit_rating: newRating,
          credit_score: newCreditScore
        } : member
      ));
    } catch (error) {
      console.error('Error actualizando calificación crediticia:', error);
      alert('Error al actualizar calificación: ' + error.message);
    }
  };

  const getCreditRatingInfo = (rating) => {
    switch(rating) {
      case 'green':
        return { label: 'Excelente', icon: '🟢', class: 'excellent' };
      case 'yellow':
        return { label: 'Regular', icon: '🟡', class: 'regular' };
      case 'red':
        return { label: 'Observado', icon: '🔴', class: 'poor' };
      default:
        return { label: 'Sin calificar', icon: '⚪', class: 'unrated' };
    }
  };

  const filteredAndSortedMembers = React.useMemo(() => {
    let filtered = members.filter(member => {
      // Validar que el miembro existe y tiene las propiedades necesarias
      if (!member || !member.name) {
        console.warn('Miembro inválido encontrado:', member);
        return false;
      }
      
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = ratingFilter === 'all' || member.credit_rating === ratingFilter;
      return matchesSearch && matchesRating;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [members, searchTerm, ratingFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
  };


  const calculateTotalGuarantee = () => {
    return members.reduce((total, member) => total + (member.shares * (settings?.shareValue || 500)), 0);
  };

  // Función para exportar miembros a Excel
  const handleExportToExcel = () => {
    const columns = [
      { header: 'Nombre', accessor: 'name', width: 30 },
      { header: 'DNI', accessor: 'dni', width: 15 },
      { header: 'Teléfono', accessor: 'phone', width: 18 },
      { header: 'Email', accessor: 'email', width: 30 },
      { header: 'Dirección', accessor: 'address', width: 40 },
      { header: 'Acciones', accessor: 'shares', type: 'number', width: 12 },
      { header: 'Garantía', accessor: 'guarantee', type: 'currency', width: 15 },
      { header: 'Calificación', accessor: 'credit_rating', width: 15 },
      { header: 'Puntaje Crediticio', accessor: 'credit_score', type: 'number', width: 18 },
      { header: 'Fecha de Ingreso', accessor: 'joinDate', type: 'date', width: 18 }
    ];

    const data = members.map(member => ({
      name: member.name,
      dni: member.dni,
      phone: member.phone || 'N/A',
      email: member.email || 'N/A',
      address: member.address || 'N/A',
      shares: member.shares,
      guarantee: member.shares * (settings?.shareValue || 500),
      credit_rating: member.credit_rating === 'green' ? 'Excelente' : 
                    member.credit_rating === 'yellow' ? 'Regular' : 'Observado',
      credit_score: member.credit_score || 0,
      joinDate: member.joinDate || new Date().toISOString()
    }));

    generateExcelWithColors(
      data,
      columns,
      'Miembros_Banquito.xlsx',
      'Miembros'
    );
  };

  // Función para importar miembros desde Excel
  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await importFromExcel(file);
      
      // Buscar la hoja de miembros
      const sheet = result['Miembros'] || result[Object.keys(result)[0]];
      
      if (!sheet || !sheet.data || sheet.data.length === 0) {
        alert('No se encontraron datos válidos en el archivo Excel');
        return;
      }

      // Mapear los datos importados a la estructura de miembros
      const importedMembers = sheet.data.map((row, index) => {
        // Determinar calificación crediticia basada en el texto o puntaje
        let credit_rating = 'green';
        if (row['Calificación']) {
          if (row['Calificación'].toLowerCase().includes('regular')) {
            credit_rating = 'yellow';
          } else if (row['Calificación'].toLowerCase().includes('observado') || 
                     row['Calificación'].toLowerCase().includes('riesgo')) {
            credit_rating = 'red';
          }
        } else if (row['Puntaje Crediticio']) {
          const score = parseInt(row['Puntaje Crediticio']);
          if (score < 40) credit_rating = 'red';
          else if (score < 70) credit_rating = 'yellow';
        }

        return {
          name: row['Nombre'] || `Miembro ${index + 1}`,
          dni: row['DNI'] || '',
          phone: row['Teléfono'] || row['Telefono'] || '',
          email: row['Email'] || row['Correo'] || '',
          shares: parseInt(row['Acciones']) || 1,
          credit_rating: credit_rating,
          credit_score: parseInt(row['Puntaje Crediticio']) || 
                      (credit_rating === 'green' ? 80 : credit_rating === 'yellow' ? 55 : 30)
        };
      });

      // Validar DNIs únicos
      const existingDNIs = members.map(m => m.dni);
      const newValidMembers = importedMembers.filter(member => {
        if (!member.dni) return false;
        if (existingDNIs.includes(member.dni)) {
          console.warn(`DNI duplicado: ${member.dni}`);
          return false;
        }
        return true;
      });

      if (newValidMembers.length === 0) {
        alert('No se encontraron miembros válidos para importar (posibles DNIs duplicados)');
        return;
      }

      // Confirmar importación
      const confirmImport = window.confirm(
        `Se importarán ${newValidMembers.length} miembros nuevos.\n` +
        `${importedMembers.length - newValidMembers.length} miembros fueron omitidos por DNI duplicado.\n\n` +
        `¿Desea continuar?`
      );

      if (confirmImport) {
        // Crear miembros usando la API
        let importedCount = 0;
        for (const memberData of newValidMembers) {
          try {
            const createdMember = await memberService.createMember(memberData);
            setMembers(prev => [...prev, createdMember]);
            importedCount++;
          } catch (error) {
            console.error(`Error creando miembro ${memberData.name}:`, error);
          }
        }
        alert(`✅ Se importaron ${importedCount} miembros exitosamente!`);
        if (importedCount < newValidMembers.length) {
          alert(`⚠️ ${newValidMembers.length - importedCount} miembros no pudieron ser importados.`);
        }
      }

    } catch (error) {
      console.error('Error al importar Excel:', error);
      alert('❌ Error al importar el archivo Excel: ' + error.message);
    }

    // Limpiar el input
    event.target.value = '';
  };


  // Calcular garantía dinámica basada en acciones
  const calculateGuarantee = (member) => {
    return member.shares * (settings?.shareValue || 500);
  };

  const handleCreditRatingChange = async (memberId, newRating) => {
    try {
      // Calcular nuevo puntaje crediticio basado en la evaluación
      const getScoreFromRating = (rating) => {
        switch(rating) {
          case 'green': return Math.floor(Math.random() * 30) + 61; // 61-90
          case 'yellow': return Math.floor(Math.random() * 30) + 31; // 31-60
          case 'red': return Math.floor(Math.random() * 30) + 1; // 1-30
          default: return 50;
        }
      };

      const newCreditScore = getScoreFromRating(newRating);

      // Preparar datos para actualización (usar snake_case para el backend)
      const updateData = {
        credit_rating: newRating,
        credit_score: newCreditScore
      };

      console.log('🔄 Actualizando calificación crediticia:', {
        memberId,
        newRating,
        newCreditScore
      });

      // Actualizar en la base de datos
      await memberService.updateMember(memberId, updateData);
      
      console.log('✅ Calificación crediticia guardada en la base de datos');

      // Actualizar estado local solo después de que se guarde en DB
      setMembers(members.map(member => 
        member.id === memberId ? { 
          ...member, 
          creditRating: newRating,
          creditScore: newCreditScore,
          credit_rating: newRating, // Mantener ambos formatos por compatibilidad
          credit_score: newCreditScore
        } : member
      ));

      // Actualizar también el miembro que se está viendo
      if (viewingMember && viewingMember.id === memberId) {
        setViewingMember(prev => ({
          ...prev,
          creditRating: newRating,
          creditScore: newCreditScore,
          credit_rating: newRating,
          credit_score: newCreditScore
        }));
      }

    } catch (error) {
      console.error('❌ Error actualizando calificación crediticia:', error);
      alert('Error al guardar la calificación crediticia: ' + error.message);
    }
  };

  const getRatingCounts = () => {
    return {
      green: members.filter(m => m && m.credit_rating === 'green').length,
      yellow: members.filter(m => m && m.credit_rating === 'yellow').length,
      red: members.filter(m => m && m.credit_rating === 'red').length
    };
  };

  const ratingCounts = getRatingCounts();

  if (loading) {
    return (
      <div className={`members-table-container ${darkMode ? 'dark' : ''}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando miembros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`members-table-container ${darkMode ? 'dark' : ''}`}>
        <div className="error-container">
          <h3>❌ Error al cargar miembros</h3>
          <p>{error}</p>
          <button onClick={loadMembers} className="retry-btn">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`members-table-container ${darkMode ? 'dark' : ''}`}>
      <div className="members-header">
        <h2>👥 Gestión de Miembros</h2>
        <div className="members-summary">
          <div className="summary-stat">
            <span className="stat-label">Total miembros:</span>
            <span className="stat-value">{members.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Garantía total:</span>
            <span className="stat-value">S/ {calculateTotalGuarantee().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="rating-summary">
        <div className="rating-card excellent">
          <div className="rating-icon">🟢</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.green}</div>
            <div className="rating-label">Excelente</div>
          </div>
        </div>
        <div className="rating-card regular">
          <div className="rating-icon">🟡</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.yellow}</div>
            <div className="rating-label">Regular</div>
          </div>
        </div>
        <div className="rating-card poor">
          <div className="rating-icon">🔴</div>
          <div className="rating-content">
            <div className="rating-count">{ratingCounts.red}</div>
            <div className="rating-label">Observado</div>
          </div>
        </div>
      </div>

      <div className="members-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar miembro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rating-filter"
          >
            <option value="all">Todas las calificaciones</option>
            <option value="green">🟢 Excelente</option>
            <option value="yellow">🟡 Regular</option>
            <option value="red">🔴 Observado</option>
          </select>
        </div>

        <div className="add-member-section">
          <button 
            className="add-member-btn"
            onClick={() => setShowAddMemberModal(true)}
            title="Agregar nuevo miembro"
          >
            👤➕ Agregar Miembro
          </button>
          
          <button 
            className="export-btn"
            onClick={handleExportToExcel}
            title="Exportar miembros a Excel"
          >
            📊 Exportar Excel
          </button>
          <input
            type="file"
            id="excel-import"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleImportFromExcel}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="members-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Nombre {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('dni')} className="sortable">
                DNI {getSortIcon('dni')}
              </th>
              <th onClick={() => handleSort('shares')} className="sortable">
                Acciones {getSortIcon('shares')}
              </th>
              <th onClick={() => handleSort('guarantee')} className="sortable">
                Garantía {getSortIcon('guarantee')}
              </th>
              <th>Calificación Crediticia</th>
              <th>Contacto</th>
              <th>Límite Préstamo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedMembers.map(member => {
              const ratingInfo = getCreditRatingInfo(member.credit_rating);
              const dynamicGuarantee = calculateGuarantee(member);
              const loanLimit = Math.min(settings?.loanLimits?.individual || 8000, dynamicGuarantee * 0.8);
              
              return (
                <tr key={member.id} className={`member-row ${ratingInfo.class}`}>
                  <td className="member-name">
                    <div className="name-info">
                      <span className="name">{member.name}</span>
                      <span className="id">ID: {member.id}</span>
                    </div>
                  </td>
                  <td className="member-dni">
                    {member.dni}
                  </td>
                  <td className="shares">
                    <div className="shares-info">
                      <span className="shares-count">{member.shares}</span>
                      <span className="shares-label">acciones</span>
                    </div>
                  </td>
                  <td className="guarantee">
                    S/ {dynamicGuarantee.toLocaleString()}
                  </td>
                  <td className="credit-rating">
                    <div className="rating-display">
                      <span className={`rating-badge ${ratingInfo.class}`}>
                        {ratingInfo.icon} {ratingInfo.label}
                      </span>
                      <div className="rating-actions">
                        <button 
                          className="rating-btn green"
                          onClick={() => updateCreditRating(member.id, 'green')}
                          title="Marcar como Excelente"
                        >
                          🟢
                        </button>
                        <button 
                          className="rating-btn yellow"
                          onClick={() => updateCreditRating(member.id, 'yellow')}
                          title="Marcar como Regular"
                        >
                          🟡
                        </button>
                        <button 
                          className="rating-btn red"
                          onClick={() => updateCreditRating(member.id, 'red')}
                          title="Marcar como Observado"
                        >
                          🔴
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="contact">
                    <div className="contact-info">
                      <div className="phone">📞 {member.phone}</div>
                      <div className="email">📧 {member.email}</div>
                    </div>
                  </td>
                  <td className="loan-limit">
                    <div className="limit-info">
                      <span className="limit-amount">S/ {loanLimit.toLocaleString()}</span>
                      <span className="limit-percentage">(80% garantía)</span>
                    </div>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn edit" 
                      onClick={() => handleEditMember(member)}
                      title="Editar miembro"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn view" 
                      onClick={() => setViewingMember(member)}
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn savings" 
                      onClick={() => setViewingSavingsPlan(member)}
                      title="Ver plan de ahorro"
                    >
                      💰
                    </button>
                    <button 
                      className="action-btn delete-user" 
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      title="Eliminar miembro del sistema"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSortedMembers.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">👥</div>
            <h3>No se encontraron miembros</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {editingMember && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>✏️ Editar Miembro</h3>
              <button className="close-btn" onClick={handleCancelEdit}>❌</button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>DNI:</label>
                <input
                  type="text"
                  value={editingMember.dni}
                  onChange={(e) => setEditingMember(prev => ({...prev, dni: e.target.value}))}
                  maxLength="8"
                />
              </div>
              
              <div className="form-group">
                <label>Acciones:</label>
                <input
                  type="number"
                  value={editingMember.shares}
                  onChange={(e) => setEditingMember(prev => ({...prev, shares: parseInt(e.target.value) || 0}))}
                />
              </div>
              
              <div className="form-group">
                <label>Garantía (S/):</label>
                <input
                  type="number"
                  value={editingMember.guarantee}
                  onChange={(e) => setEditingMember(prev => ({...prev, guarantee: parseInt(e.target.value) || 0}))}
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono:</label>
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember(prev => ({...prev, email: e.target.value}))}
                />
              </div>
              
              <div className="form-group">
                <label>Puntaje Crediticio (0-90):</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={editingMember.credit_score || 90}
                  onChange={(e) => {
                    const score = parseInt(e.target.value) || 0;
                    const clampedScore = Math.max(0, Math.min(90, score));
                    let newRating = 'red';
                    if (clampedScore >= 70) newRating = 'green';
                    else if (clampedScore >= 40) newRating = 'yellow';
                    
                    setEditingMember(prev => ({
                      ...prev, 
                      credit_score: clampedScore,
                      credit_rating: newRating
                    }));
                  }}
                />
                <small className="score-indicator">
                  {editingMember.credit_score >= 70 && '🟢 Excelente (70-90)'}
                  {editingMember.credit_score >= 40 && editingMember.credit_score < 70 && '🟡 Regular (40-69)'}
                  {editingMember.credit_score < 40 && '🔴 Riesgo (0-39)'}
                </small>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveMember}>
                💾 Guardar
              </button>
              <button className="cancel-btn" onClick={handleCancelEdit}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingMember && (
        <div className="view-modal-overlay">
          <div className="view-modal">
            <div className="view-modal-header">
              <div className="member-title">
                <div className="member-avatar">
                  {viewingMember.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-basic-info">
                  <h2>{viewingMember.name}</h2>
                  <p className="member-subtitle">Miembro ID: {viewingMember.id}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setViewingMember(null)}>×</button>
            </div>
            
            <div className="view-modal-content">
              {/* Información Personal */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">👤</div>
                  <h3>Información Personal</h3>
                </div>
                <div className="info-grid">
                  <div className="info-card">
                    <div className="info-label">Nombre Completo</div>
                    <div className="info-value">{viewingMember.name}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">DNI</div>
                    <div className="info-value">{viewingMember.dni}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Teléfono</div>
                    <div className="info-value">{viewingMember.phone}</div>
                  </div>
                  <div className="info-card">
                    <div className="info-label">Email</div>
                    <div className="info-value">{viewingMember.email}</div>
                  </div>
                </div>
              </div>

              {/* Credenciales de Acceso */}
              {(() => {
                // TODO: Obtener información del usuario desde API si es necesario
                const memberUser = viewingMember.user; // Asumiendo que viene del backend
                return memberUser ? (
                  <div className="info-section">
                    <div className="section-header">
                      <div className="section-icon">🔐</div>
                      <h3>Credenciales de Acceso al Sistema</h3>
                    </div>
                    <div className="credentials-grid">
                      <div className="credential-card">
                        <div className="credential-label">Usuario</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.username}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(memberUser.username);
                              alert('Usuario copiado al portapapeles');
                            }}
                            title="Copiar usuario"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="credential-card">
                        <div className="credential-label">Contraseña</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.password}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(memberUser.password);
                              alert('Contraseña copiada al portapapeles');
                            }}
                            title="Copiar contraseña"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="credential-card full-width">
                        <div className="credential-label">Acceso Completo</div>
                        <div className="credential-value">
                          <span className="credential-text">{memberUser.username} / {memberUser.password}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(`${memberUser.username} / ${memberUser.password}`);
                              alert('Credenciales completas copiadas al portapapeles');
                            }}
                            title="Copiar usuario y contraseña"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="credentials-note">
                      <span className="note-icon">💡</span>
                      <span className="note-text">
                        Estas credenciales permiten al miembro acceder al sistema. 
                        Se recomienda que el usuario cambie su contraseña después del primer acceso.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="info-section">
                    <div className="section-header">
                      <div className="section-icon">⚠️</div>
                      <h3>Credenciales de Acceso</h3>
                    </div>
                    <div className="no-credentials">
                      <p>Este miembro no tiene credenciales de acceso al sistema.</p>
                      <p>Se recomienda crear un usuario asociado para que pueda acceder al sistema.</p>
                    </div>
                  </div>
                );
              })()}

              {/* Información Financiera */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">💰</div>
                  <h3>Información Financiera</h3>
                </div>
                <div className="info-grid">
                  <div className="info-card highlight">
                    <div className="info-label">Acciones</div>
                    <div className="info-value big">{viewingMember.shares}</div>
                    <div className="info-subtitle">S/ {(viewingMember.shares * (settings?.shareValue || 500)).toLocaleString()} total</div>
                  </div>
                  <div className="info-card highlight">
                    <div className="info-label">Garantía</div>
                    <div className="info-value big">S/ {calculateGuarantee(viewingMember).toLocaleString()}</div>
                    <div className="info-subtitle">Monto respaldado</div>
                  </div>
                  <div className="info-card highlight">
                    <div className="info-label">Límite de Préstamo</div>
                    <div className="info-value big">S/ {Math.min(settings?.loanLimits?.individual || 8000, calculateGuarantee(viewingMember) * 0.8).toLocaleString()}</div>
                    <div className="info-subtitle">80% de garantía (máx. S/ {(settings?.loanLimits?.individual || 8000).toLocaleString()})</div>
                  </div>
                </div>
              </div>

              {/* Calificación Crediticia */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">📊</div>
                  <h3>Evaluación Crediticia</h3>
                </div>
                <div className="credit-info">
                  <div className="credit-rating-display">
                    <div className={`rating-circle ${getCreditRatingInfo(viewingMember.credit_rating).class}`}>
                      <div className="rating-icon">{getCreditRatingInfo(viewingMember.credit_rating).icon}</div>
                      <div className="rating-label">{getCreditRatingInfo(viewingMember.credit_rating).label}</div>
                    </div>
                    <div className="rating-controls">
                      <label>Cambiar Evaluación:</label>
                      <select 
                        value={viewingMember.credit_rating} 
                        onChange={(e) => handleCreditRatingChange(viewingMember.id, e.target.value)}
                        className="rating-select"
                      >
                        <option value="green">🟢 Excelente</option>
                        <option value="yellow">🟡 Regular</option>
                        <option value="red">🔴 Observado</option>
                      </select>
                    </div>
                    <div className="credit-score-info">
                      <div className="score-label">Puntaje Crediticio</div>
                      <div className="score-value">{viewingMember.credit_score}<span className="score-max">/90</span></div>
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{
                            width: `${(viewingMember.credit_score / 90) * 100}%`,
                            backgroundColor: viewingMember.credit_rating === 'green' ? '#28a745' : 
                                           viewingMember.credit_rating === 'yellow' ? '#ffc107' : '#dc3545'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Estado */}
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon">📈</div>
                  <h3>Estado del Miembro</h3>
                </div>
                <div className="status-cards">
                  <div className="status-card">
                    <div className="status-icon">🏦</div>
                    <div className="status-label">Miembro Activo</div>
                    <div className="status-value">Desde 2023</div>
                  </div>
                  <div className="status-card">
                    <div className="status-icon">📋</div>
                    <div className="status-label">Utilización</div>
                    <div className="status-value">{Math.round((viewingMember.guarantee * 0.8 / viewingMember.guarantee) * 100)}%</div>
                  </div>
                  <div className="status-card">
                    <div className="status-icon">⚡</div>
                    <div className="status-label">Estado</div>
                    <div className="status-value">
                      {viewingMember.credit_rating === 'green' ? 'Excelente' : 
                       viewingMember.credit_rating === 'yellow' ? 'Regular' : 'Requiere Atención'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="view-modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setViewingMember(null)}
              >
                Cerrar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingMember(viewingMember);
                  setViewingMember(null);
                }}
              >
                ✏️ Editar Miembro
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingSavingsPlan && (
        <div className="modal-overlay">
          <div className="modal savings-modal">
            <div className="modal-header">
              <h3>Plan de Ahorro - {viewingSavingsPlan.name}</h3>
              <button className="close-btn" onClick={() => setViewingSavingsPlan(null)}>❌</button>
            </div>
            <div className="modal-content">
              <SavingsPlan 
                guarantee={calculateGuarantee(viewingSavingsPlan)} 
                memberName={viewingSavingsPlan.name}
              />
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>👤➕ Agregar Nuevo Miembro</h3>
              <button className="close-btn" onClick={handleCancelAddMember}>❌</button>
            </div>
            
            <div className="modal-content">
              <div className="form-section">
                <h4>📋 Información Personal</h4>
                <div className="form-group">
                  <label>Nombre Completo *:</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({...prev, name: e.target.value}))}
                    placeholder="Nombre completo del miembro"
                  />
                </div>
                
                <div className="form-group">
                  <label>DNI * (8 dígitos):</label>
                  <input
                    type="text"
                    value={newMember.dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Solo números
                      if (value.length <= 8) {
                        setNewMember(prev => ({...prev, dni: value}));
                      }
                    }}
                    maxLength="8"
                    placeholder="12345678"
                  />
                  <small className="field-hint">
                    {newMember.dni.length}/8 caracteres
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="text"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({...prev, phone: e.target.value}))}
                    placeholder="987654321"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({...prev, email: e.target.value}))}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>💰 Información Financiera</h4>
                <div className="form-group">
                  <label>Acciones Iniciales:</label>
                  <input
                    type="number"
                    value={newMember.shares}
                    onChange={(e) => setNewMember(prev => ({...prev, shares: parseInt(e.target.value) || 10}))}
                    min="1"
                    placeholder="10"
                  />
                  <small>Valor por acción: S/ {(settings?.shareValue || 500).toLocaleString()}</small>
                </div>
              </div>

              <div className="form-section">
                <h4>🔐 Credenciales de Acceso</h4>
                <div className="form-group">
                  <label>Nombre de Usuario *:</label>
                  <input
                    type="text"
                    value={newMember.username}
                    onChange={(e) => setNewMember(prev => ({...prev, username: e.target.value.toLowerCase()}))}
                    placeholder="usuario123"
                  />
                  <small>Solo letras minúsculas y números, sin espacios</small>
                </div>
                
                <div className="form-group">
                  <label>Contraseña *:</label>
                  <input
                    type="text"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({...prev, password: e.target.value}))}
                    placeholder="contraseña123"
                  />
                  <small>El usuario podrá cambiar su contraseña después</small>
                </div>
              </div>

              <div className="member-preview">
                <h4>📊 Resumen del Nuevo Miembro</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Garantía inicial:</span>
                    <span>S/ {((newMember.shares || 10) * (settings?.shareValue || 500)).toLocaleString()}</span>
                  </div>
                  <div className="preview-item">
                    <span>Límite de préstamo:</span>
                    <span>S/ {Math.min(settings?.loanLimits?.individual || 8000, ((newMember.shares || 10) * (settings?.shareValue || 500)) * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="preview-item">
                    <span>Calificación inicial:</span>
                    <span>🟢 Excelente (90/90)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="save-btn" onClick={handleAddMember}>
                👤➕ Crear Miembro y Usuario
              </button>
              <button className="cancel-btn" onClick={handleCancelAddMember}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-footer">
        <div className="results-count">
          Mostrando {filteredAndSortedMembers.length} de {members.length} miembros
        </div>
      </div>
    </div>
  );
};

export default MembersTable;