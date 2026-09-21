import Image from "next/image";
import Link from "next/link";
import "./landing.css";
import { SiteNav } from "./SiteNav";

export function Marca() {
  return (
    <span className="brand">
      <Image src="/img/logo.png" alt="Logo PetHood" width={44} height={44} />
      <span className="logo">PetHood</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header>
      <div className="wrap">
        <Link href="/">
          <Marca />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
