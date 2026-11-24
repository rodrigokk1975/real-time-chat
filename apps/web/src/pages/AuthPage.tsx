import { useState, type FormEvent } from "react";
import {
  Radio,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Database,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Handshake autenticado com JWT",
    desc: "Validação de token nas rotas REST e antes de abrir a conexão Socket.IO.",
  },
  {
    icon: Users,
    title: "Presença online multi-aba",
    desc: "Gerenciamento por socket mantém você online enquanto houver uma aba ativa.",
  },
  {
    icon: Database,
    title: "Histórico persistido por sala",
    desc: "Mensagens salvas em SQLite com paginação por cursor em ordem cronológica.",
  },
];

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0C0E] text-zinc-100 grid lg:grid-cols-12">
      {/* Left column: product context */}
      <section className="hidden lg:flex lg:col-span-6 flex-col justify-between border-r border-white/[0.07] bg-[#0F1115] p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Radio className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">PulseChat</span>
          <span className="ml-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-zinc-400">
            Socket.IO + JWT
          </span>
        </div>

        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white leading-tight">
              Conversas em tempo real organizadas por salas.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Conecte-se em canais dedicados, acompanhe quem está online no instante e retome
              o histórico completo sempre que voltar.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="text-xs leading-relaxed text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[11px] text-zinc-600">
          React · TypeScript · Node.js · Socket.IO · Prisma SQLite
        </p>
      </section>

      {/* Right column: auth form */}
      <section className="lg:col-span-6 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Radio className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">PulseChat</span>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "login"
                ? "Informe suas credenciais para acessar as salas."
                : "Cadastre-se em segundos para começar a conversar."}
            </p>
          </div>

          <div
            role="tablist"
            className="grid grid-cols-2 rounded-lg border border-white/[0.08] bg-[#111317] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-md py-2 text-xs font-medium transition ${
                mode === "login"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-md py-2 text-xs font-medium transition ${
                mode === "register"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-zinc-300">
                  Nome de exibição
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Ana Costa"
                    className="w-full rounded-lg border border-white/[0.09] bg-[#111317] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-300">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full rounded-lg border border-white/[0.09] bg-[#111317] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "register" ? 6 : 1}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                  className="w-full rounded-lg border border-white/[0.09] bg-[#111317] py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50"
            >
              {submitting
                ? "Autenticando..."
                : mode === "login"
                  ? "Entrar no workspace"
                  : "Criar conta e entrar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
