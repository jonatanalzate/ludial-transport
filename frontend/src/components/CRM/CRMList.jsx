import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import { Search, FileDownload } from '@mui/icons-material';
import { api } from '../../services/api';

const CRMList = () => {
  const [trayectos, setTrayectos] = useState([]);
  const [filteredTrayectos, setFilteredTrayectos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadTrayectos();
  }, []);

  useEffect(() => {
    filterTrayectos();
  }, [searchTerm, trayectos]);

  const loadTrayectos = async () => {
    try {
      const response = await api.getTrayectos();
      // console.log('Trayectos cargados:', response.data);
      
      const trayectosCompletados = response.data
        .filter(t => t.estado.toUpperCase() === 'COMPLETADO')
        .sort((a, b) => new Date(b.fecha_llegada) - new Date(a.fecha_salida));
      
      // console.log('Trayectos completados:', trayectosCompletados);
      setTrayectos(trayectosCompletados);
      setFilteredTrayectos(trayectosCompletados);
    } catch (error) {
      console.error('Error al cargar trayectos:', error);
    }
  };

  const filterTrayectos = () => {
    const filtered = trayectos.filter(trayecto => 
      trayecto.nombre_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trayecto.nombre_conductor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trayecto.placa_vehiculo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTrayectos(filtered);
    setPage(0);
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToCSV = () => {
    const headers = [
      'Ruta',
      'Fecha Salida',
      'Fecha Llegada',
      'Duración (min)',
      'Conductor',
      'Vehículo',
      'Pasajeros'
    ];

    const csvData = filteredTrayectos.map(t => [
      t.nombre_ruta,
      formatDateTime(t.fecha_salida),
      formatDateTime(t.fecha_llegada),
      t.duracion_minutos || '-',
      t.nombre_conductor,
      t.placa_vehiculo,
      t.cantidad_pasajeros
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trayectos_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Histórico de Trayectos</Typography>
        <Tooltip title="Exportar a CSV">
          <IconButton onClick={exportToCSV}>
            <FileDownload />
          </IconButton>
        </Tooltip>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por ruta, conductor o vehículo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ruta</TableCell>
              <TableCell>Fecha Salida</TableCell>
              <TableCell>Fecha Llegada</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Conductor</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Pasajeros</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrayectos.length > 0 ? (
              filteredTrayectos
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trayecto) => (
                  <TableRow key={trayecto.id}>
                    <TableCell>{trayecto.nombre_ruta}</TableCell>
                    <TableCell>{formatDateTime(trayecto.fecha_salida)}</TableCell>
                    <TableCell>{formatDateTime(trayecto.fecha_llegada)}</TableCell>
                    <TableCell>{trayecto.duracion_minutos || '-'} min</TableCell>
                    <TableCell>{trayecto.nombre_conductor}</TableCell>
                    <TableCell>{trayecto.placa_vehiculo}</TableCell>
                    <TableCell>{trayecto.cantidad_pasajeros}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay trayectos completados para mostrar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredTrayectos.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página"
      />
    </Box>
  );
};

export default CRMList; 