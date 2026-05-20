"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

type Durum = { hata?: string } | undefined;

export function LoginForm() {
  const [durum, action, yukleniyor] = useActionState<Durum, FormData>(
    login,
    undefined
  );

  return (
    <Card className="border-slate-700 bg-slate-800/80 backdrop-blur shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-slate-300 text-sm font-medium">Hilal HR</span>
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          Giriş Yap
        </CardTitle>
        <CardDescription className="text-slate-400">
          Hesabınıza erişmek için bilgilerinizi girin
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {durum?.hata && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {durum.hata}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300">
              E-posta
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@sirket.com"
              required
              autoComplete="email"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300">
              Şifre
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
            id="btn-giris"
          >
            {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>

          <p className="text-sm text-slate-400 text-center">
            Hesabınız yok mu?{" "}
            <Link
              href="/kayit"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Kayıt Ol
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
