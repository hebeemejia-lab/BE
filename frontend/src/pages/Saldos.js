import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  CircularProgress,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SouthWestRoundedIcon from '@mui/icons-material/SouthWestRounded';
import { AuthContext } from '../context/AuthContext';
import { depositoAPI, inversionesAPI, transferAPI } from '../services/api';

const CRYPTO_COINS = [
  { value: 'BTC',  label: 'Bitcoin (BTC)',  networks: ['Bitcoin Network'] },
  { value: 'ETH',  label: 'Ethereum (ETH)', networks: ['ERC-20 (Ethereum)', 'Arbitrum', 'Optimism'] },
  { value: 'SOL',  label: 'Solana (SOL)',   networks: ['Solana Network'] },
  { value: 'BNB',  label: 'BNB',            networks: ['BEP-20 (BSC)'] },
  { value: 'DOGE', label: 'Dogecoin (DOGE)',networks: ['Dogecoin Network'] },
  { value: 'ADA',  label: 'Cardano (ADA)',  networks: ['Cardano Network'] },
  { value: 'USDT', label: 'USDT',           networks: ['ERC-20 (Ethereum)', 'TRC-20 (TRON)', 'BEP-20 (BSC)'] },
  { value: 'USDC', label: 'USDC',           networks: ['ERC-20 (Ethereum)', 'Solana', 'Arbitrum'] },
];

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

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const formatUsd = (value) =>
  toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.mensaje
  || error?.response?.data?.error
  || error?.message
  || fallback;

function Saldos() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Usuario';

  const [activeFlow, setActiveFlow] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [walletStats, setWalletStats] = useState({
    saldoDisponible: toNumber(usuario?.saldo),
    recargasExitosas: 0,
    totalRecargado: 0,
    transferencias: 0,
    comprasActivas: 0,
  });

  const [depositForm, setDepositForm] = useState({ method: 'paypal', amount: '', code: '' });
  const [buyForm, setBuyForm] = useState({ symbol: '', cantidad: '' });
  const [transferForm, setTransferForm] = useState({ modo: 'cedula', cedula: '', walletId: '', monto: '', concepto: 'Transferencia crypto' });
  const [withdrawForm, setWithdrawForm] = useState({ coin: 'BTC', network: 'Bitcoin Network', walletAddress: '', monto: '' });
  const [availableNetworks, setAvailableNetworks] = useState(CRYPTO_COINS[0].networks);
  const [assetQuery, setAssetQuery] = useState('');
  const [assetOptions, setAssetOptions] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  const isPositiveAmount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0;
  };

  const openFeedback = (severity, message) => {
    setFeedback({ open: true, severity, message });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, open: false }));
  };

  const loadWalletStats = useCallback(async () => {
    setStatsLoading(true);

    const [recargasResult, transferenciasResult, posicionesResult] = await Promise.allSettled([
      depositoAPI.obtenerDepositos(),
      transferAPI.obtenerHistorial(),
      inversionesAPI.obtenerPosiciones(),
    ]);

    const recargas = recargasResult.status === 'fulfilled' ? asArray(recargasResult.value?.data) : [];
    const recargasExitosas = recargas.filter((recarga) => String(recarga.estado || '').toLowerCase() === 'exitosa');
    const totalRecargado = recargasExitosas.reduce(
      (sum, recarga) => sum + toNumber(recarga.montoNeto ?? recarga.monto),
      0,
    );

    const transferencias = transferenciasResult.status === 'fulfilled'
      ? asArray(transferenciasResult.value?.data)
      : [];

    let comprasActivas = 0;
    if (posicionesResult.status === 'fulfilled') {
      const payload = posicionesResult.value?.data;
      if (Array.isArray(payload)) {
        comprasActivas = payload.length;
      } else if (Array.isArray(payload?.posiciones)) {
        comprasActivas = payload.posiciones.length;
      }
    }

    setWalletStats({
      saldoDisponible: toNumber(usuario?.saldo),
      recargasExitosas: recargasExitosas.length,
      totalRecargado,
      transferencias: transferencias.length,
      comprasActivas,
    });

    setStatsLoading(false);
  }, [usuario?.saldo]);

  useEffect(() => {
    const state = location.state || {};
    if (state.openFlow === 'deposit') {
      setDepositForm((prev) => ({
        ...prev,
        method: state.depositMethod === 'codigo' ? 'codigo' : 'paypal',
      }));
      setActiveFlow('deposit');
    }
    if (state.openFlow === 'buy') {
      setActiveFlow('buy');
    }
    if (state.openFlow === 'transfer') {
      setActiveFlow('transfer');
    }
    if (state.openFlow === 'withdraw-crypto') {
      const requestedCoin = String(state.coin || 'BTC').toUpperCase();
      const coinMeta = CRYPTO_COINS.find((c) => c.value === requestedCoin) || CRYPTO_COINS[0];
      setAvailableNetworks(coinMeta.networks);
      setWithdrawForm({
        coin: coinMeta.value,
        network: coinMeta.networks[0],
        walletAddress: '',
        monto: '',
      });
      setActiveFlow('withdraw-crypto');
    }
  }, [location.state]);

  useEffect(() => {
    loadWalletStats();
  }, [loadWalletStats]);

  useEffect(() => {
    if (activeFlow !== 'buy') return;

    const query = assetQuery.trim();
    if (query.length < 1) {
      setAssetOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAssetsLoading(true);
        const response = await inversionesAPI.buscarActivos(query, { assetClass: 'crypto' });
        const resultados = asArray(response?.data?.resultados);
        setAssetOptions(resultados);
        setBuyForm((prev) => {
          if (resultados.length === 0) {
            return prev.symbol ? { ...prev, symbol: '' } : prev;
          }

          const currentStillVisible = resultados.some((asset) => asset.symbol === prev.symbol);
          return currentStillVisible ? prev : { ...prev, symbol: resultados[0].symbol };
        });
      } catch (error) {
        setAssetOptions([]);
      } finally {
        setAssetsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [activeFlow, assetQuery]);

  const resetDeposit = () => setDepositForm({ method: 'paypal', amount: '', code: '' });
  const resetBuy = () => setBuyForm({ symbol: '', cantidad: '' });
  const resetTransfer = () => setTransferForm({ modo: 'cedula', cedula: '', walletId: '', monto: '', concepto: 'Transferencia crypto' });
  const resetWithdraw = () => {
    setAvailableNetworks(CRYPTO_COINS[0].networks);
    setWithdrawForm({ coin: 'BTC', network: 'Bitcoin Network', walletAddress: '', monto: '' });
  };

  const handleDepositConfirm = async () => {
    if (processing) return;

    try {
      setProcessing(true);

      if (depositForm.method === 'codigo') {
        if (!depositForm.code.trim()) {
          openFeedback('error', 'Ingresa un código válido.');
          return;
        }

        const response = await depositoAPI.canjearCodigo({ codigo: depositForm.code.trim() });
        openFeedback('success', response?.data?.mensaje || 'Código canjeado exitosamente.');
        setActiveFlow(null);
        resetDeposit();
        await loadWalletStats();
        return;
      }

      if (!isPositiveAmount(depositForm.amount)) {
        openFeedback('error', 'Ingresa un monto mayor que cero para PayPal.');
        return;
      }

      const response = await depositoAPI.crearDepositoPayPal({ monto: Number(depositForm.amount) });
      const checkoutUrl = response?.data?.checkoutUrl;

      if (!checkoutUrl) {
        openFeedback('error', 'PayPal no devolvió URL de pago.');
        return;
      }

      openFeedback('success', 'Redirigiendo a PayPal...');
      window.location.assign(checkoutUrl);
    } catch (error) {
      openFeedback('error', getErrorMessage(error, 'No se pudo procesar el depósito.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleBuyConfirm = async () => {
    if (processing) return;

    try {
      if (!buyForm.symbol.trim()) {
        openFeedback('error', 'Selecciona un activo válido antes de comprar.');
        return;
      }
      if (!isPositiveAmount(buyForm.cantidad)) {
        openFeedback('error', 'La cantidad debe ser mayor que cero.');
        return;
      }

      setProcessing(true);
      const response = await inversionesAPI.comprar({
        symbol: buyForm.symbol.trim().toUpperCase(),
        cantidad: Number(buyForm.cantidad),
        assetClass: 'crypto',
      });

      openFeedback('success', response?.data?.mensaje || 'Compra ejecutada correctamente.');
      setActiveFlow(null);
      resetBuy();
      await loadWalletStats();
    } catch (error) {
      openFeedback('error', getErrorMessage(error, 'No se pudo ejecutar la compra.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferConfirm = async () => {
    if (processing) return;

    try {
      if (transferForm.modo === 'cedula' && !transferForm.cedula.trim()) {
        openFeedback('error', 'Ingresa la cédula del destinatario.');
        return;
      }
      if (transferForm.modo === 'wallet' && !transferForm.walletId.trim()) {
        openFeedback('error', 'Ingresa el ID de wallet (BE-XXXXXX).');
        return;
      }
      if (!isPositiveAmount(transferForm.monto)) {
        openFeedback('error', 'Ingresa un monto mayor que cero.');
        return;
      }

      setProcessing(true);
      const payload = {
        monto: Number(transferForm.monto),
        concepto: transferForm.concepto.trim() || 'Transferencia crypto',
      };
      if (transferForm.modo === 'wallet') {
        payload.wallet_id = transferForm.walletId.trim();
      } else {
        payload.cedula_destinatario = transferForm.cedula.trim();
      }

      const response = await transferAPI.realizar(payload);
      openFeedback('success', response?.data?.mensaje || 'Transferencia realizada correctamente.');
      setActiveFlow(null);
      resetTransfer();
      await loadWalletStats();
    } catch (error) {
      openFeedback('error', getErrorMessage(error, 'No se pudo realizar la transferencia.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawCryptoConfirm = async () => {
    if (processing) return;

    try {
      const addr = withdrawForm.walletAddress.trim();
      if (!addr) {
        openFeedback('error', 'Ingresa la dirección de wallet destino.');
        return;
      }
      if (!isPositiveAmount(withdrawForm.monto)) {
        openFeedback('error', 'Ingresa un monto mayor que cero.');
        return;
      }

      setProcessing(true);
      const response = await transferAPI.retiroCryptoWallet({
        walletAddress: addr,
        coin:          withdrawForm.coin,
        network:       withdrawForm.network,
        monto:         Number(withdrawForm.monto),
      });

      openFeedback('success', response?.data?.mensaje || 'Retiro solicitado correctamente.');
      setActiveFlow(null);
      resetWithdraw();
      await loadWalletStats();
    } catch (error) {
      openFeedback('error', getErrorMessage(error, 'No se pudo procesar el retiro.'));
    } finally {
      setProcessing(false);
    }
  };

  const quickActions = useMemo(() => ([
    {
      id: 'deposit',
      title: 'Depositar',
      subtitle: 'PayPal o código',
      icon: <PaymentsOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => {
        setDepositForm((prev) => ({ ...prev, method: 'paypal' }));
        setActiveFlow('deposit');
      },
    },
    {
      id: 'buy',
      title: 'Comprar crypto',
      subtitle: 'Orden real Alpaca Crypto',
      icon: <ShoppingBagOutlinedIcon sx={{ fontSize: 28 }} />,
      onClick: () => {
        setAssetQuery('');
        setActiveFlow('buy');
      },
    },
    {
      id: 'transfer',
      title: 'Transferir',
      subtitle: 'Cédula o ID de wallet BE',
      icon: <SendRoundedIcon sx={{ fontSize: 28 }} />,
      onClick: () => setActiveFlow('transfer'),
    },
    {
      id: 'withdraw-crypto',
      title: 'Retirar a wallet',
      subtitle: 'Binance, Coinbase, etc.',
      icon: <SouthWestRoundedIcon sx={{ fontSize: 28, transform: 'rotate(180deg)' }} />,
      onClick: () => setActiveFlow('withdraw-crypto'),
    },
  ]), []);

  const mainActions = [
    {
      id: 'deposit',
      title: 'Deposita',
      description: 'Métodos activos: PayPal y código de recarga.',
      icon: <SouthWestRoundedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('deposit'),
    },
    {
      id: 'buy',
      title: 'Compra crypto',
      description: 'Envía orden real IOC a Alpaca Crypto.',
      icon: <ShoppingBagOutlinedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('buy'),
    },
    {
      id: 'transfer',
      title: 'Transfiere',
      description: 'Transferencia real vía /transferencias/realizar.',
      icon: <SendRoundedIcon sx={{ fontSize: 32 }} />,
      onClick: () => setActiveFlow('transfer'),
    },
  ];

  const walletMetrics = [
    {
      label: 'Saldo Chain',
      value: `USD ${formatUsd(walletStats.saldoDisponible)}`,
      helper: 'Saldo disponible en tu cuenta',
    },
    {
      label: 'Depósitos exitosos',
      value: String(walletStats.recargasExitosas),
      helper: `Total recargado: USD ${formatUsd(walletStats.totalRecargado)}`,
    },
    {
      label: 'Transferencias',
      value: String(walletStats.transferencias),
      helper: 'Movimientos desde historial real',
    },
    {
      label: 'Compras activas',
      value: String(walletStats.comprasActivas),
      helper: 'Posiciones abiertas en inversiones',
    },
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
                    Esta vista solo usa operaciones conectadas a APIs activas en producción: depositar, comprar crypto y transferir.
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

            <Alert severity="warning" sx={{ borderRadius: '14px' }}>
              Las compras crypto se envían como ordenes reales a Alpaca Crypto. Usa pares validos como BTC/USD o ETH/USD.
            </Alert>

            <Grid container spacing={2}>
              {walletMetrics.map((metric) => (
                <Grid item xs={12} sm={6} md={3} key={metric.label}>
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
                      {statsLoading ? (
                        <Stack direction="row" alignItems="center" sx={{ mt: 1.4 }}>
                          <CircularProgress size={20} sx={{ color: '#bfdbfe' }} />
                          <Typography sx={{ ml: 1.2, fontSize: '0.9rem', color: 'rgba(226,232,240,0.7)' }}>
                            Cargando...
                          </Typography>
                        </Stack>
                      ) : (
                        <>
                          <Typography sx={{ mt: 1.2, fontSize: { xs: '1.3rem', md: '1.55rem' }, fontWeight: 800 }}>
                            {metric.value}
                          </Typography>
                          <Typography sx={{ mt: 0.7, fontSize: '0.9rem', color: 'rgba(226,232,240,0.68)' }}>
                            {metric.helper}
                          </Typography>
                        </>
                      )}
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
            <Alert severity="info">Métodos activos en esta vista: PayPal y código de recarga.</Alert>
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

            {depositForm.method === 'paypal' && (
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={depositForm.amount}
                onChange={(event) => setDepositForm((prev) => ({ ...prev, amount: event.target.value }))}
                inputProps={{ min: 0, step: '0.01', 'aria-label': 'Monto a depositar' }}
                InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetDeposit(); }} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleDepositConfirm} disabled={processing}>
            {processing ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeFlow === 'buy'} onClose={() => setActiveFlow(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Compra crypto</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">Busca BTC o ETH y selecciona un par real de crypto como BTC/USD. Esta vista ya no lista acciones.</Alert>
            <TextField
              fullWidth
              label="Buscar símbolo"
              value={assetQuery}
              onChange={(event) => setAssetQuery(event.target.value)}
              inputProps={{ 'aria-label': 'Buscar símbolo para compra' }}
              placeholder="Ej: BTC, ETH, SOL"
            />
            <FormControl fullWidth>
              <InputLabel id="buy-symbol-label">Símbolo</InputLabel>
              <Select
                labelId="buy-symbol-label"
                label="Símbolo"
                value={buyForm.symbol}
                onChange={(event) => setBuyForm((prev) => ({ ...prev, symbol: event.target.value }))}
                inputProps={{ 'aria-label': 'Símbolo a comprar' }}
              >
                {assetOptions.map((asset) => (
                  <MenuItem key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} · {asset.nombre || asset.name || 'Activo'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {assetsLoading && (
              <Stack direction="row" alignItems="center">
                <CircularProgress size={18} sx={{ mr: 1.2 }} />
                <Typography sx={{ fontSize: '0.9rem' }}>Buscando activos...</Typography>
              </Stack>
            )}
            <TextField
              fullWidth
              label="Cantidad del activo"
              type="number"
              value={buyForm.cantidad}
              onChange={(event) => setBuyForm((prev) => ({ ...prev, cantidad: event.target.value }))}
              inputProps={{ min: 0, step: '0.0001', 'aria-label': 'Cantidad para comprar' }}
              InputProps={{ startAdornment: <InputAdornment position="start">QTY</InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetBuy(); }} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleBuyConfirm} disabled={processing || assetsLoading}>
            {processing ? 'Procesando...' : 'Confirmar compra'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeFlow === 'transfer'} onClose={() => setActiveFlow(null)} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Transferir</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">Envía a otra cuenta Banco Exclusivo por cédula o por ID de wallet (BE-XXXXXX).</Alert>

            <FormControl fullWidth>
              <InputLabel id="transfer-mode-label">Buscar destinatario por</InputLabel>
              <Select
                labelId="transfer-mode-label"
                label="Buscar destinatario por"
                value={transferForm.modo}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, modo: e.target.value, cedula: '', walletId: '' }))}
                inputProps={{ 'aria-label': 'Método de búsqueda' }}
              >
                <MenuItem value="cedula">🧒 Cédula</MenuItem>
                <MenuItem value="wallet">💼 ID de Wallet (BE-XXXXXX)</MenuItem>
              </Select>
            </FormControl>

            {transferForm.modo === 'cedula' ? (
              <TextField
                fullWidth
                label="Cédula del destinatario"
                value={transferForm.cedula}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, cedula: e.target.value }))}
                inputProps={{ 'aria-label': 'Cédula del destinatario' }}
                placeholder="001-1234567-8"
              />
            ) : (
              <TextField
                fullWidth
                label="ID de wallet del destinatario"
                value={transferForm.walletId}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, walletId: e.target.value }))}
                inputProps={{ 'aria-label': 'ID de wallet', style: { fontWeight: 700, letterSpacing: '0.06em' } }}
                placeholder="BE-000001"
                helperText="Formato: BE-XXXXXX"
              />
            )}

            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={transferForm.monto}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, monto: e.target.value }))}
              inputProps={{ min: 0, step: '0.01', 'aria-label': 'Monto a transferir' }}
              InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
            />
            <TextField
              fullWidth
              label="Concepto"
              value={transferForm.concepto}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, concepto: e.target.value }))}
              inputProps={{ 'aria-label': 'Concepto de la transferencia' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetTransfer(); }} disabled={processing}>Cancelar</Button>
          <Button variant="contained" onClick={handleTransferConfirm} disabled={processing}>
            {processing ? 'Procesando...' : 'Confirmar envío'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activeFlow === 'withdraw-crypto'}
        onClose={() => {
          setActiveFlow(null);
          resetWithdraw();
        }}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreenDialog}
      >
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Retirar a wallet externa</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="warning">
              El retiro se procesa en 24-48 h. Asegúrate de que la dirección y la red sean correctas; los retiros a direcciones incorrectas son irreversibles.
            </Alert>

            <FormControl fullWidth>
              <InputLabel id="withdraw-coin-label">Moneda</InputLabel>
              <Select
                labelId="withdraw-coin-label"
                label="Moneda"
                value={withdrawForm.coin}
                onChange={(e) => {
                  const selected = CRYPTO_COINS.find(c => c.value === e.target.value);
                  setAvailableNetworks(selected?.networks || []);
                  setWithdrawForm((prev) => ({
                    ...prev,
                    coin: e.target.value,
                    network: selected?.networks[0] || '',
                  }));
                }}
                inputProps={{ 'aria-label': 'Moneda a retirar' }}
              >
                {CRYPTO_COINS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="withdraw-network-label">Red</InputLabel>
              <Select
                labelId="withdraw-network-label"
                label="Red"
                value={withdrawForm.network}
                onChange={(e) => setWithdrawForm((prev) => ({ ...prev, network: e.target.value }))}
                inputProps={{ 'aria-label': 'Red blockchain' }}
              >
                {availableNetworks.map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Dirección de wallet destino"
              value={withdrawForm.walletAddress}
              onChange={(e) => setWithdrawForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
              inputProps={{ 'aria-label': 'Dirección de wallet', style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
              placeholder="Ej: 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf..."
              helperText="Verifica que la dirección corresponda a la red seleccionada"
            />

            <TextField
              fullWidth
              label="Monto a retirar"
              type="number"
              value={withdrawForm.monto}
              onChange={(e) => setWithdrawForm((prev) => ({ ...prev, monto: e.target.value }))}
              inputProps={{ min: 0.01, step: '0.01', 'aria-label': 'Monto a retirar' }}
              InputProps={{ startAdornment: <InputAdornment position="start">USD</InputAdornment> }}
              helperText={`Saldo Chain disponible: USD ${formatUsd(walletStats.saldoDisponible)}`}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setActiveFlow(null); resetWithdraw(); }} disabled={processing}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleWithdrawCryptoConfirm} disabled={processing}>
            {processing ? 'Procesando...' : 'Solicitar retiro'}
          </Button>
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