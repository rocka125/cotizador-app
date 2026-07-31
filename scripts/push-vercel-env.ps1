# Sube las variables de entorno de .env.local a Vercel (Production) y redepliega.
# Correr TU MISMO desde la raiz del proyecto: powershell -ExecutionPolicy Bypass -File scripts\push-vercel-env.ps1
#
# NEXT_PUBLIC_APP_URL se pide aparte porque en .env.local apunta a localhost,
# y en Vercel debe ser tu dominio publico real (https://tu-proyecto.vercel.app
# o tu dominio propio) para que el pixel de rastreo de apertura sea alcanzable
# por clientes de correo reales.

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.local")) {
  Write-Error "No se encontro .env.local en el directorio actual. Corre este script desde la raiz de cotizador-app."
  exit 1
}

# 1. Login (abre el navegador para que autorices tu cuenta -- no requiere que
#    pegues nada aqui).
vercel login

# 2. Vincula esta carpeta al proyecto de Vercel ya desplegado (te preguntara
#    cual proyecto es si hay mas de uno).
vercel link

# 3. Dominio publico real del deploy -- NO localhost.
$appUrl = Read-Host "Pega aqui la URL publica real de tu deploy en Vercel (ej. https://cotizador-app-xxxx.vercel.app)"

# 4. Lee .env.local y sube cada variable SMTP_*/NEXT_PUBLIC_SUPABASE_* tal cual,
#    y NEXT_PUBLIC_APP_URL con el valor que acabas de pegar.
$envLines = Get-Content ".env.local" | Where-Object { $_ -match "^[A-Z_]+=" }

foreach ($line in $envLines) {
  $name, $value = $line -split "=", 2
  if ($name -eq "NEXT_PUBLIC_APP_URL") { $value = $appUrl }
  if ([string]::IsNullOrWhiteSpace($value)) { continue }

  Write-Host "Subiendo $name a Production..."
  # vercel env add falla si la variable ya existe -- la quitamos primero para
  # poder re-subir un valor actualizado sin errores.
  cmd /c "vercel env rm $name production --yes" 2>$null | Out-Null
  $value | vercel env add $name production
}

Write-Host ""
Write-Host "Listo. Redeplegando para que los cambios tomen efecto..."
vercel --prod
