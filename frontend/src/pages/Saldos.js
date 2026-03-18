import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import GoogleIcon from '@mui/icons-material/Google';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SouthWestRoundedIcon from '@mui/icons-material/SouthWestRounded';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { AuthContext } from '../context/AuthContext';

const coins = [
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'USDT', label: 'Tether' },
  { value: 'SOL', label: 'Solana' },
];

const destinationOptions = [
  { value: 'wallet-externa', label: 'Wallet externa' },
  { value: 'usuario-be', label: 'Usuario Banco Exclusivo' },
  { value: 'cuenta-vinculada', label: 'Cuenta vinculada' },
];

const walletAddresses = {
  BTC: 'bc1q-be-crypto-04x9u2m3f8',
  ETH: '0xBEwallet8f2e17c4d9a72b',
  USDT: 'TN7BEwallet4vP1a3m8x9',
  SOL: 'BEWalletSolana7dF92Lx11',
};

const panelSx = {
  borderRadius: '24px',
  border: '1px solid rgba(167, 216, 255, 0.12)',
  background: 'linear-gradient(160deg, rgba(5, 15, 46, 0.88) 0%, rgba(12, 31, 74, 0.78) 100%)',
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.24)',
  color: '#f8fafc',
};

const sectionTitleSx = {
  fontSize: '0.8rem',
  fontWeight: 800,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#93c5fd',
};

function Saldos() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Usuario';
  const [activeFlow, setActiveFlow] = useState(null);
  const [depositForm, setDepositForm] = useState({ method: 'paypal', amount: '', code: '' });
  const [buyForm, setBuyForm] = useState({ coin: 'BTC', amount: '' });
  const [transferForm, setTransferForm] = useState({ destination: '', currency: 'USDT', amount: '', recipient: '' });
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    const state = location.state || {};
    if (state.openFlow === 'deposit') {
      setDepositForm((prev) => ({
        ...prev,
        method: state.depositMethod || prev.method,
      }));
      setActiveFlow('deposit');
    }
    if (state.openFlow === 'buy') {
      setActiveFlow('buy');
    }
    if (state.openFlow === 'transfer') {
      setActiveFlow('transfer');
    }
  }, [location.state]);

  const openFeedback = (severity, message) => {
    setFeedback({ open: true, severity, message });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, open: false }));
  };

  const isPositiveAmount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0;
  };

  const resetDeposit = () => setDepositForm({ method: 'paypal', amount: '', code: '' });
  const resetBuy = () => setBuyForm({ coin: 'BTC', amount: '' });
  const resetTransfer = () => setTransferForm({ destination: '', currency: 'USDT', amount: '', recipient: '' });

  const handleDepositConfirm = () => {
    if (!depositForm.method) {
      openFeedback('error', 'Selecciona un método de depósito.');
      return;
    }
    if (!isPositiveAmount(depositForm.amount)) {
      openFeedback('error', 'Ingresa un monto mayor que cero.');
      return;
    }
    if (depositForm.method === 'codigo' && !depositForm.code.trim()) {
      openFeedback('error', 'Ingresa el código para continuar.');
      return;
    }
    openFeedback('success', `Depósito preparado por USD ${Number(depositForm.amount).toFixed(2)} con ${depositForm.method}.`);
    setActiveFlow(null);
    resetDeposit();
  };

  const handleBuyConfirm = () => {
    if (!buyForm.coin) {
      openFeedback('error', 'Selecciona una moneda para comprar.');
      return;
    }
    if (!isPositiveAmount(buyForm.amount)) {
      openFeedback('error', 'Ingresa un monto mayor que cero para comprar crypto.');
      return;
    }
    openFeedback('success', `Compra de ${buyForm.coin} iniciada por USD ${Number(buyForm.amount).toFixed(2)}.`);
    setActiveFlow(null);
    resetBuy();
  };

  const handleTransferConfirm = () => {
    if (!transferForm.destination) {
      openFeedback('error', 'Selecciona el destino de la transferencia.');
      return;
    }
    if (!transferForm.currency) {
      openFeedback('error', 'Selecciona la moneda a transferir.');
      return;
    }
    if (!transferForm.recipient.trim()) {
      openFeedback('error', 'Ingresa la referencia o dirección de destino.');
      return;
    }
    if (!isPositiveAmount(transferForm.amount)) {
      openFeedback('error', 'Ingresa un monto mayor que cero.');
      return;
    }
    openFeedback('success', `Transferencia de ${transferForm.currency} preparada por USD ${Number(transferForm.amount).toFixed(2)}.`);
    setActiveFlow(null);
    resetTransfer();
  };

  const quickActions = [
    {
      id: 'paypal',
      title: 'Depositar con PayPal',
      subtitle: 'Fondos inmediatos',
      icon: <PaymentsOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => {
        setDepositForm((prev) => ({ ...prev, method: 'paypal' }));
        setActiveFlow('deposit');
      },
    },
    {
      id: 'google-pay',
      title: 'Depositar con Google Pay',
      subtitle: 'Un toque y confirma',
      icon: <GoogleIcon sx={{ fontSize: 28 }} />,
      onClick: () => {
        setDepositForm((prev) => ({ ...prev, method: 'googlepay' }));
        setActiveFlow('deposit');
      },
    },
    {
      id: 'codigo',
      title: 'Usar Código',
      subtitle: 'Canje manual de saldo',
      icon: <VpnKeyOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => {
        setDepositForm((prev) => ({ ...prev, method: 'codigo' }));
        setActiveFlow('deposit');
      },
    },
    {
      id: 'wallet',
      title: 'Crypto Wallet',
      subtitle: 'Vista general de activos',
      icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate('/saldos'),
    },
  ];

  const mainActions = [
    {
      id: 'deposit',
      title: 'Deposita',
      description: 'Selecciona método, monto y confirma fondos.',
      icon: <SouthWestRoundedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('deposit'),
    },
    {
      id: 'buy',
      title: 'Compra crypto',
      description: 'Elige moneda, monto y escanea QR de compra.',
      icon: <ShoppingBagOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('buy'),
    },
    {
      id: 'transfer',
      title: 'Transfiere',
      description: 'Selecciona destino, moneda y confirma envío.',
      icon: <SendRoundedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('transfer'),
    },
  ];

  const walletMetrics = [
    { label: 'Saldo wallet', value: 'USD 12,480.00', helper: 'Disponible para nuevas operaciones' },
    { label: 'Activos activos', value: '4', helper: 'BTC, ETH, USDT y SOL' },
    { label: 'Red principal', value: 'Operativa', helper: 'Sin incidencias en confirmación' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #001a4d 0%, #002570 55%, #003d99 100%)',
        color: '#f8fafc',
        pt: { xs: '100px', md: '28px' },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Box sx={{ maxWidth: '1260px', mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Paper sx={{ ...panelSx, p: { xs: 2.25, md: 3 } }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1.75} alignItems="center">
                <Box
                  component="img"
                  src="/imagen/BE (1) (1).png"
                  alt="Banco Exclusivo"
                  sx={{ width: 52, height: 52, borderRadius: '16px', objectFit: 'contain', bgcolor: 'rgba(255,255,255,0.08)', p: 1 }}
                />
                <Box>
                  <Typography sx={sectionTitleSx}>Bienvenido</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                    Crypto Wallet de {nombreCompleto}
                  </Typography>
                  <Typography sx={{ mt: 0.75, color: 'rgba(226, 232, 240, 0.76)', maxWidth: '62ch', fontSize: { xs: '0.92rem', md: '1rem' } }}>
                    Gestiona tus depósitos, compras y transferencias con el mismo lenguaje visual del dashboard bancario.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip label="MODO WALLET" sx={{ bgcolor: 'rgba(59,130,246,0.18)', color: '#bfdbfe', fontWeight: 700, letterSpacing: '0.08em' }} />
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  aria-label="Volver al dashboard"
                  sx={{
                    color: '#e2e8f0',
                    borderColor: 'rgba(167,216,255,0.24)',
                    borderRadius: '14px',
                    px: 2,
                    py: 1,
                    '&:hover': { borderColor: 'rgba(167,216,255,0.44)', bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  Volver al dashboard
                </Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              {walletMetrics.map((metric) => (
                <Grid item xs={12} sm={4} key={metric.label}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '20px',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(167,216,255,0.12)',
                      boxShadow: 'none',
                      color: '#f8fafc',
                    }}
                  >
                    <CardContent sx={{ p: 2.25 }}>
                      <Typography sx={sectionTitleSx}>{metric.label}</Typography>
                      <Typography sx={{ mt: 1.2, fontSize: { xs: '1.3rem', md: '1.55rem' }, fontWeight: 800 }}>
                        {metric.value}
                      </Typography>
                      <Typography sx={{ mt: 0.7, fontSize: '0.9rem', color: 'rgba(226,232,240,0.68)' }}>
                        {metric.helper}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>

        <Paper sx={{ ...panelSx, mt: 2.5, p: { xs: 2.25, md: 3 } }}>
          <Typography sx={sectionTitleSx}>Acciones rápidas</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={3} key={action.id}>
                <Button
                  fullWidth
                  onClick={action.onClick}
                  aria-label={action.title}
                  sx={{
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    borderRadius: '20px',
                    px: 2,
                    py: 1.8,
                    minHeight: 118,
                    color: '#f8fafc',
                    border: '1px solid rgba(167,216,255,0.12)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
                    '&:hover': {
                      background: 'linear-gradient(160deg, rgba(37,99,235,0.22) 0%, rgba(14,116,144,0.18) 100%)',
                      borderColor: 'rgba(147,197,253,0.28)',
                    },
                  }}
                >
                  <Stack spacing={1.25} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(59,130,246,0.18)',
                        color: '#bfdbfe',
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ ...sectionTitleSx, color: '#dbeafe', fontSize: '0.72rem' }}>{action.title}</Typography>
                      <Typography sx={{ mt: 0.7, fontSize: '0.92rem', color: 'rgba(226,232,240,0.76)', textTransform: 'none', letterSpacing: 0 }}>
                        {action.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ ...panelSx, mt: 2.5, p: { xs: 2.25, md: 3 } }}>
          <Typography sx={sectionTitleSx}>Transferencias y operaciones</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {mainActions.map((action) => (
              <Grid item xs={12} md={4} key={action.id}>
                <Button
                  fullWidth
                  onClick={action.onClick}
                  aria-label={action.title}
                  sx={{
                    minHeight: 148,
                    borderRadius: '22px',
                    px: 2.25,
                    py: 2,
                    color: '#f8fafc',
                    border: '1px solid rgba(167,216,255,0.14)',
                    background: 'linear-gradient(155deg, rgba(7, 18, 48, 0.9) 0%, rgba(16, 39, 86, 0.78) 100%)',
                    boxShadow: 'none',
                    '&:hover': {
                      background: 'linear-gradient(155deg, rgba(29, 78, 216, 0.34) 0%, rgba(14, 116, 144, 0.28) 100%)',
                    },
                  }}
                >
                  <Stack alignItems="flex-start" spacing={1.25}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(96,165,250,0.16)',
                        color: '#dbeafe',
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography sx={{ ...sectionTitleSx, color: '#f8fafc', fontSize: '0.82rem' }}>{action.title}</Typography>
                    <Typography sx={{ color: 'rgba(226,232,240,0.74)', fontSize: '0.95rem', textTransform: 'none', letterSpacing: 0, textAlign: 'left' }}>
                      {action.description}
                    </Typography>
                  </Stack>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>

      <Dialog open={activeFlow === 'deposit'} onClose={() => setActiveFlow(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Depositar</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">Selecciona el método, ingresa el monto y confirma la operación.</Alert>
            <FormControl fullWidth>
              <InputLabel id="deposit-method-label">Método</InputLabel>
              <Select
                labelId="deposit-method-label"
                label="Método"
                value={depositForm.method}
                onChange={(event) => setDepositForm((prev) => ({ ...prev, method: event.target.value }))}
                inputProps={{ 'aria-label': 'Método de depósito' }}
              >
                <MenuItem value="paypal">Depositar con PayPal</MenuItem>
                <MenuItem value="googlepay">Depositar con Google Pay</MenuItem>
                <MenuItem value="codigo">Usar Código</MenuItem>
              </Select>
            </FormControl>
            {depositForm.method === 'codigo' && (
              <TextField
                fullWidth
                label="Código"
                value={depositForm.code}
                onChange={(event) => setDepositForm((prev) => ({ ...prev, code: event.target.value }))}
                inputProps={{ 'aria-label': 'Código de depósito' }}
              />
            )}
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={depositForm.amount}
              onChange={(event) => setDepositForm((prev) => ({ ...prev, amount: event.target.value }))}
              inputProps={{ min: 0, step: '0.01', 'aria-label': 'Monto a depositar' }}
              InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetDeposit(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleDepositConfirm}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeFlow === 'buy'} onClose={() => setActiveFlow(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Compra crypto</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">Elige la moneda, indica el monto y escanea el QR para completar la compra.</Alert>
            <FormControl fullWidth>
              <InputLabel id="buy-coin-label">Moneda</InputLabel>
              <Select
                labelId="buy-coin-label"
                label="Moneda"
                value={buyForm.coin}
                onChange={(event) => setBuyForm((prev) => ({ ...prev, coin: event.target.value }))}
                inputProps={{ 'aria-label': 'Moneda a comprar' }}
              >
                {coins.map((coin) => (
                  <MenuItem key={coin.value} value={coin.value}>{coin.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={buyForm.amount}
              onChange={(event) => setBuyForm((prev) => ({ ...prev, amount: event.target.value }))}
              inputProps={{ min: 0, step: '0.01', 'aria-label': 'Monto para comprar crypto' }}
              InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
            />
            <Paper
              variant="outlined"
              sx={{
                borderRadius: '20px',
                borderColor: 'rgba(167,216,255,0.24)',
                bgcolor: 'rgba(15,23,42,0.04)',
                p: 2,
              }}
            >
              <Stack spacing={1.5} alignItems="center">
                <QrCode2RoundedIcon sx={{ fontSize: 112, color: '#1d4ed8' }} aria-hidden="true" />
                <Typography sx={{ ...sectionTitleSx, color: '#1e3a8a' }}>Escanear QR</Typography>
                <Typography sx={{ fontSize: '0.92rem', textAlign: 'center', color: '#334155' }}>
                  Dirección de compra para {buyForm.coin}: {walletAddresses[buyForm.coin]}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetBuy(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleBuyConfirm}>Confirmar compra</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeFlow === 'transfer'} onClose={() => setActiveFlow(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Transfiere</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">Selecciona el destino, la moneda y el monto antes de confirmar.</Alert>
            <FormControl fullWidth>
              <InputLabel id="transfer-destination-label">Destino</InputLabel>
              <Select
                labelId="transfer-destination-label"
                label="Destino"
                value={transferForm.destination}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, destination: event.target.value }))}
                inputProps={{ 'aria-label': 'Destino de la transferencia' }}
              >
                {destinationOptions.map((destination) => (
                  <MenuItem key={destination.value} value={destination.value}>{destination.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="transfer-currency-label">Moneda</InputLabel>
              <Select
                labelId="transfer-currency-label"
                label="Moneda"
                value={transferForm.currency}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, currency: event.target.value }))}
                inputProps={{ 'aria-label': 'Moneda a transferir' }}
              >
                {coins.map((coin) => (
                  <MenuItem key={coin.value} value={coin.value}>{coin.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Referencia o dirección"
              value={transferForm.recipient}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, recipient: event.target.value }))}
              inputProps={{ 'aria-label': 'Dirección o referencia de destino' }}
            />
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={transferForm.amount}
              onChange={(event) => setTransferForm((prev) => ({ ...prev, amount: event.target.value }))}
              inputProps={{ min: 0, step: '0.01', 'aria-label': 'Monto a transferir' }}
              InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetTransfer(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleTransferConfirm}>Confirmar envío</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={4200} onClose={closeFeedback} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          onClose={closeFeedback}
          severity={feedback.severity}
          iconMapping={{ success: <CheckCircleOutlineRoundedIcon fontSize="inherit" /> }}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Saldos;