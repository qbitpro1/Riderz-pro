import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Photo media="cityNightRain" sizes="100vw" className="opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/85 to-void" />
      </div>

      <div className="shell relative py-24 text-center">
        <p className="eyebrow mb-4">404 · Wrong turn</p>
        <h1 className="display-1">THIS ROAD ENDS HERE.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm text-ash md:text-base">
          The page you're after has moved or never existed. The garage is still open, though.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Back home
            <Icon name="arrow" size={15} />
          </Link>
          <Link href="/cars" className="btn btn-outline">
            Browse cars
          </Link>
          <Link href="/shop" className="btn btn-outline">
            Shop accessories
          </Link>
        </div>
      </div>
    </section>
  );
}
