import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link className="mr-6 flex items-center space-x-2 font-bold" href="/">
            <span>WealthSphere</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/accounts">Accounts</Link>
            <Link href="/assets">Assets</Link>
            <Link href="/expenses">Expenses</Link>
            <Link href="/income">Income</Link>
            <Link href="/family">Family</Link>
            <Link href="/insurance">Insurance</Link>
            <Link href="/projections">Projections</Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 