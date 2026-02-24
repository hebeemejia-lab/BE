# BIMI (Brand Indicators for Message Identification) para Banco Exclusivo

Sigue estos pasos para activar el logo de tu marca en Gmail y otros clientes compatibles:

## 1. Sube tu SVG a una URL pública

Ya tienes el archivo SVG en:
/frontend/public/imagen/image2vector.svg

Asegúrate de que esté accesible en producción, por ejemplo:
https://www.bancoexclusivo.lat/imagen/image2vector.svg

## 2. Agrega el registro BIMI en tu DNS

Agrega este registro TXT:

```
default._bimi.bancoexclusivo.lat IN TXT "v=BIMI1; l=https://www.bancoexclusivo.lat/imagen/image2vector.svg;"
```

- Si tu proveedor DNS no permite el subdominio default._bimi, busca la opción de agregar registros TXT personalizados.
- El valor l= debe apuntar exactamente a la URL pública del SVG.

## 3. Verifica SPF, DKIM y DMARC

- SPF y DKIM deben estar correctamente configurados.
- DMARC debe estar en modo quarantine o reject, por ejemplo:

```
_dmarc.bancoexclusivo.lat IN TXT "v=DMARC1; p=quarantine; rua=mailto:postmaster@bancoexclusivo.lat"
```

## 4. (Opcional) Certificado VMC para el check azul

- Si quieres la insignia de verificado (check azul), compra un VMC (Verified Mark Certificate) con tu marca registrada.
- Proveedores: Entrust, DigiCert.

## 5. Verifica tu BIMI

- Usa https://bimigroup.org/tools/bimi-generator/ o https://www.google.com/gmail/brand/ para validar tu configuración.

---

¿Dudas? Consulta la documentación oficial de BIMI: https://bimigroup.org/