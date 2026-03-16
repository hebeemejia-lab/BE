import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, TextField, Paper } from '@mui/material';

function CriptoDemoMockup() {
  const [tipo, setTipo] = useState('depositar');

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Navbar profesional */}
      <AppBar position="static" sx={{ bgcolor: '#003366' }}>
        <Toolbar>
          <img src="/logo.png" alt="Banco Exclusivo" style={{ height: 40, marginRight: 16 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#fff' }}>
            Banco Exclusivo
          </Typography>
          <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>Usuario</Typography>
        </Toolbar>
      </AppBar>

      {/* Leyenda */}
      <Box sx={{ bgcolor: '#1976d2', py: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
          Demo interna: transferencias cripto
        </Typography>
      </Box>

      {/* Tabs de MUI */}
      <Tabs
        value={tipo}
        onChange={(_, v) => setTipo(v)}
        centered
        textColor="primary"
        indicatorColor="secondary"
        sx={{
          bgcolor: '#fff',
          '& .MuiTab-root': {
            fontWeight: 'bold',
            color: '#003366',
            '&:hover': { bgcolor: '#d32f2f', color: '#fff' }
          },
          '& .Mui-selected': {
            color: '#d32f2f !important'
          },
          '& .MuiTabs-indicator': {
            bgcolor: '#d32f2f'
          }
        }}
      >
        <Tab label="Depósito" value="depositar" />
        <Tab label="Retiro" value="retirar" />
      </Tabs>

      {/* Cuerpo principal */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: 4
        }}
      >
        {/* Formulario Depósito */}
        <Paper elevation={3} sx={{ flex: 1, p: 3, borderRadius: 3 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#003366', mb: 2 }}>
            {tipo === 'depositar' ? 'Depósito Cripto' : 'Retiro Cripto'} (Tailwind)
          </Typography>
          <TextField
            label="Monto"
            fullWidth
            margin="normal"
            InputProps={{
              sx: { borderColor: '#1976d2', '&.Mui-focused fieldset': { borderColor: '#d32f2f' } }
            }}
          />
          <TextField
            label="Dirección"
            fullWidth
            margin="normal"
            InputProps={{
              sx: { borderColor: '#1976d2', '&.Mui-focused fieldset': { borderColor: '#d32f2f' } }
            }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: '#003366',
              color: '#fff',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#d32f2f' }
            }}
          >
            {tipo === 'depositar' ? 'Depositar' : 'Retirar'}
          </Button>
        </Paper>

        {/* Formulario Retiro */}
        <Paper elevation={3} sx={{ flex: 1, p: 3, borderRadius: 3 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#003366', mb: 2 }}>
            {tipo === 'depositar' ? 'Depósito Cripto' : 'Retiro Cripto'} (MUI)
          </Typography>
          <TextField
            label="Monto"
            fullWidth
            margin="normal"
            InputProps={{
              sx: { borderColor: '#1976d2', '&.Mui-focused fieldset': { borderColor: '#d32f2f' } }
            }}
          />
          <TextField
            label="Dirección"
            fullWidth
            margin="normal"
            InputProps={{
              sx: { borderColor: '#1976d2', '&.Mui-focused fieldset': { borderColor: '#d32f2f' } }
            }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: '#003366',
              color: '#fff',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#d32f2f' }
            }}
          >
            {tipo === 'depositar' ? 'Depositar' : 'Retirar'}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

export default CriptoDemoMockup;
