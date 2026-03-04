import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api/auth'
import styles from './Login.module.css'

const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  remember: z.boolean(),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  async function onSubmit(data: LoginFormInputs) {
    setApiError(null)
    setLoading(true)
    try {
      const res = await authApi.login({ email: data.email, password: data.password })
      login(res.data.access_token, null)
      navigate('/', { replace: true })
    } catch {
      setApiError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <div className={styles.flexBottom}>
            <div className={styles.headlineContainer}>
              <h1 className={styles.headlineTitle}>
                J<span className={styles.highlight}>&</span>S Ferretería
              </h1>
              <h2 className={styles.headlineDescription}>
                Soluciones en Construcción y Minería
              </h2>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader} style={{ animation: `${styles.fadeSlideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: '0.1s' }}>
              <h2 className={styles.formTitle}>¡BIENVENIDO!</h2>
              <p className={styles.formSubtitle}>Ingresa tus detalles para acceder.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.formBody}>
              <div className={styles.inputGroup} style={{ animation: `${styles.fadeSlideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: '0.2s' }}>
                <label className={styles.inputLabel}>Correo Electrónico</label>
                <input
                  type="email"
                  className={styles.inputField}
                  placeholder="Ingresa tu correo"
                  {...register('email')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className={styles.errorMessage}>{errors.email.message}</p>
                )}
              </div>

              <div className={styles.inputGroup} style={{ animation: `${styles.fadeSlideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: '0.3s' }}>
                <label className={styles.inputLabel}>Contraseña</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    style={{ paddingRight: '2.5rem', letterSpacing: showPassword ? 'normal' : '0.1em' }}
                    placeholder="••••••••"
                    {...register('password')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleButton}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                  </button>
                </div>
                {errors.password && (
                  <p className={styles.errorMessage}>{errors.password.message}</p>
                )}
              </div>

              <div className={styles.formOptions} style={{ animation: `${styles.fadeSlideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: '0.4s' }}>
                <label className={styles.rememberMeLabel}>
                  <div className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      {...register('remember')}
                      className={styles.checkbox}
                    />
                    <svg className={styles.checkboxIcon} viewBox="0 0 14 14" fill="none">
                      <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className={styles.rememberMeText}>Recuérdame</span>
                </label>
              </div>

              {apiError && (
                <div className={styles.apiErrorBox}>{apiError}</div>
              )}

              <button type="submit" disabled={loading} className={styles.submitBtn} style={{ animation: `${styles.fadeSlideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: '0.5s' }}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
