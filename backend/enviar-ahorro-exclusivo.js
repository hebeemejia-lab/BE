const sgMail = require('@sendgrid/mail');
const plantillaAhorro = require('./plantilla-ahorro-exclusivo');

// Agrega tu API Key de SendGrid aquí o usa process.env.SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'TU_API_KEY_AQUI');

const correos = [
  'negocioconmaria@gmail.com',
  'umcfacturacion@gmail.com',
  'icdesaladenegocios@gmail.com',
  'inmobiliariahdn@gmail.com',
  'globalgroupml2020@gmail.com',
  'wvelazquezinmobiliaria@gmail.com',
  'g.contreras.negocios@gmail.com',
  'emzb.negocios@gmail.com',
  'negocios.mozaz@gmail.com',
  'centrodenegociosmultiservices@gmail.com',
  'elvagonrojo.negocios@gmail.com',
  'negociosentrepanales@gmail.com',
  'marcosr.negocios@gmail.com',
  'bryanmcqueen.negocios@gmail.com',
  'thelma.negocios@gmail.com',
  'talig.negocios@gmail.com',
  'carmadi.negocios@gmail.com',
  'rdjavi.negocios@gmail.com',
  'dasito.negocios@gmail.com',
  'acr.negocios@gmail.com',
  'holadaniela.negocios@gmail.com',
  'rdk1ller.negocios@gmail.com',
  'anitorres.negocios@gmail.com',
  'homocromia.negocios@gmail.com',
  'ludmitch.negocios@gmail.com',
  'daxlowrey.negocios@gmail.com',
  'betholiver.negocios@gmail.com',
  'pablomoralescastro.negocios@gmail.com',
  'emadrenado.negocios@gmail.com',
  'optionhouse.negocios@gmail.com',
  'ramirezserra.negocios@gmail.com',
  'soynath.negocios@gmail.com',
  'mariarecarey.negocios@gmail.com',
  'creandonegociosrd@gmail.com',
  'almuerzodenegocios@gmail.com',
  'hgbusinessconsultingrd@gmail.com',
  'negociosymercadosrd@gmail.com',
  'obmmultiservicios.negocios@gmail.com',
  'barbaromvp.negocios@gmail.com',
  'julissacastillo.negocios@gmail.com',
  'khloe.negocios@gmail.com',
  'luki.negocios@gmail.com',
  'fernanrd.negocios@gmail.com',
  'expo.negocios.rd@gmail.com',
  'sevanegocios@gmail.com',
  'beriland.srl@gmail.com'
];

async function enviarCorreos() {
  for (const to of correos) {
    const msg = {
      to,
      from: 'info@bancoexclusivo.com', // Cambia por tu remitente verificado
      subject: plantillaAhorro.subject,
      html: plantillaAhorro.html,
    };
    try {
      await sgMail.send(msg);
      console.log(`Correo enviado a: ${to}`);
    } catch (error) {
      console.error(`Error enviando a ${to}:`, error.response ? error.response.body : error);
    }
  }
}

enviarCorreos();
