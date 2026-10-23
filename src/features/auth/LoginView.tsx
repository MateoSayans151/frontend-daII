import { Eye, EyeSlash, SignIn, WarningCircle } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { iniciarSesion } from '../../services/usuarios/usuariosSlice'

export function LoginView() {
  const dispatch = useAppDispatch()
  const { cargando, error } = useAppSelector((state) => state.usuarios)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const enviar = (event: FormEvent) => {
    event.preventDefault()
    dispatch(iniciarSesion({ email, password }))
  }

  return (
    <div className="auth-shell">
      <form className="panel auth-card" onSubmit={enviar}>
        <div className="brand auth-brand">
          <span className="brand-mark">U</span>
          <span>
            <strong>UADEnet</strong>
            <small>Gestión académica</small>
          </span>
        </div>
        <h1>Iniciar sesión</h1>
        <p className="muted-copy">Usá tu cuenta administrativa para acceder al sistema.</p>

        {error && (
          <div className="form-error summary" role="alert">
            <WarningCircle size={17} /> {error}
          </div>
        )}

        <div className="form-grid single-column">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@universidad.edu.ar"
              required
              autoFocus
            />
          </label>
          <div className="password-form-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="password-field">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
                onClick={() => setMostrarPassword((mostrar) => !mostrar)}
              >
                {mostrarPassword ? <EyeSlash size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <button className="primary-button" type="submit" disabled={cargando}>
          <SignIn size={17} /> {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
