"use client";

import { useActionState } from "react";
import { kayitOl } from "@/app/actions/auth";
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

type Durum = { hata?: string; basarili?: string } | undefined;

export function KayitForm() {
  const [durum, action, yukleniyor] = useActionState<Durum, FormData>(
    kayitOl,
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
          Kayıt Ol
        </CardTitle>
        <CardDescription className="text-slate-400">
          Yeni hesap oluşturun
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {durum?.hata && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {durum.hata}
            </div>
          )}
          {durum?.basarili && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-400">
              {durum.basarili}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="adSoyad" className="text-slate-300">
              Ad Soyad
            </Label>
            <Input
              id="adSoyad"
              name="adSoyad"
              type="text"
              placeholder="Ahmet Yılmaz"
              required
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

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
              placeholder="En az 8 karakter"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
            id="btn-kayit"
          >
            {yukleniyor ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </Button>

          <p className="text-sm text-slate-400 text-center">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/giris"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Giriş Yap
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
