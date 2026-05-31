import { redirect } from "next/navigation";

// /landing artık / adresinde, eski linkleri kırmamak için redirect
export default function LandingRedirect() {
  redirect("/");
}
