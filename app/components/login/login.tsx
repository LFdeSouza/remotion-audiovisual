import React, { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuth } from "~/hooks/useAuth";
import { LoaderCircleIcon } from "lucide-react";
import { Navigate, useLocation } from "react-router";
import Spinner from "../shared/spinner";

export default function () {
  const location = useLocation();

  type Validation = {
    email?: string;
    password?: string;
  };

  function validate(email: string, password: string) {
    const validationErrors: Validation = {};
    if (!email) {
      validationErrors["email"] = "Campo obrigatório";
    }
    if (!password) {
      validationErrors.password = "Campo obrigatório";
    }

    const hasErrors = validationErrors.email || validationErrors.password;
    return hasErrors ? validationErrors : null;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationErrror] = useState<Validation | null>(
    null,
  );
  const { user, loading, login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(email, password);
    if (validationErrors) {
      setValidationErrror(validationErrors);
      return;
    }

    const [, error] = await login(email, password);
    if (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.error ?? error.message;
        localStorage.removeItem("token");
        toast.error(message);
        return;
      }
    }

    toast.success("Login Feito com sucesso!");
  }

  if (loading) {
    return <Spinner />;
  }

  if (user) {
    return <Navigate to={`/editor${location.search}`} />;
  }

  return (
    <div className="h-screen bg-slate-900 p-10">
      <div className="mx-auto w-lg">
        <div className="mt-10 text-center">
          <h1 className="font-inter text-4xl font-bold text-blue-600">
            Teleris
            <span className="text-cyan-600">On</span>
          </h1>
          <p className="mb-14 text-sm text-gray-500">Laudo Audio-visual</p>
        </div>

        <h2 className="font-inter mb-6 text-center text-2xl font-bold text-gray-200">
          Acesse sua conta
        </h2>
        <div className="rounded-lg bg-slate-800 p-10 py-16 shadow">
          <form autoComplete="nope" onSubmit={handleSubmit}>
            <fieldset className="relative">
              <label className="block text-sm text-white">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-500 bg-slate-600 p-1.5 text-white outline-none focus:ring-2 focus:ring-blue-800"
              />
              {
                <p className="absolute -top-2 right-0 text-sm text-red-500">
                  {validationError?.email}
                </p>
              }
            </fieldset>

            <fieldset className="relative mt-7">
              <label className="block text-sm text-white">Senha</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border border-slate-500 bg-slate-600 p-1.5 text-white outline-none focus:ring-2 focus:ring-blue-800"
              />
              {
                <p className="absolute -top-2 right-0 text-sm text-red-500">
                  {validationError?.password}
                </p>
              }
            </fieldset>

            <button
              className="mt-16 flex w-full items-center justify-center gap-4 rounded-lg bg-blue-700 p-2 font-medium text-white transition-colors duration-100 ease-in-out hover:bg-blue-800 disabled:bg-slate-700"
              type="submit"
              disabled={loading}
            >
              Login
              {loading && <LoaderCircleIcon className="spinner" />}
            </button>
          </form>
        </div>
      </div>

      <div className="h-8">
        <a
          href={`https://web.whatsapp.com/send?phone=551150430558&text=Olá, sou usuário do telerison audio-visual e preciso de ajuda.`}
          target="_blank"
          className="mx-auto mt-4 flex w-fit items-center gap-2 h-4"
        >
          <svg
            className="h-7 w-7 fill-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            {/* <title>whatsapp</title> */}
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
          </svg>
          <p className="font-medium text-white">Precisa de ajuda?</p>
        </a>
      </div>
    </div>
  );
}
