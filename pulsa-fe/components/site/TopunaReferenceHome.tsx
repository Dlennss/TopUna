import Link from "next/link";

const assetBase = "/topuna-assets/Topuna_Assets_Pecah";

function AssetImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return <img src={`${assetBase}/${src}`} alt={alt} className={`block h-auto select-none ${className}`} draggable={false} />;
}

function OverlayLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  return (
    <Link href={href} prefetch={false} aria-label={label} className={`absolute block rounded-2xl ${className}`}>
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function TopunaReferenceHome() {
  return (
    <div className="min-h-dvh bg-[#fff7fa]">
      <div className="relative mx-auto w-full overflow-hidden bg-[#fff7fa] pb-[82px]">
        <section className="relative">
          <AssetImage src="09_section_blocks/top_header_stack.png" alt="Topuna dashboard header" className="w-full" />
          <OverlayLink href="/user/account/topup" label="Isi Saldo" className="left-[7.2%] top-[76.6%] h-[16.9%] w-[30.1%]" />
          <OverlayLink href="/user/saldo/kirim" label="Transfer" className="left-[38.9%] top-[76.6%] h-[16.9%] w-[27.6%]" />
          <OverlayLink href="/transaksi" label="Riwayat" className="left-[68.1%] top-[76.6%] h-[16.9%] w-[27.6%]" />
          <OverlayLink href="/login" label="Notifikasi" className="left-[77.2%] top-[8.3%] h-[17.1%] w-[9.2%] rounded-full" />
          <OverlayLink href="/login" label="Akun" className="left-[88.2%] top-[8.3%] h-[17.1%] w-[9.6%] rounded-full" />
        </section>

        <section className="relative mt-[2.2%] px-[4.4%]">
          <AssetImage src="09_section_blocks/banner_and_services.png" alt="Topuna services and banner" className="w-full" />
          <OverlayLink href="/pulsa-data" label="Top Up Sekarang" className="left-[8.7%] top-[35.3%] h-[11.5%] w-[32.3%]" />
          <OverlayLink href="/pulsa-data" label="Pulsa dan Data" className="left-[4.6%] top-[69.2%] h-[29.4%] w-[15.9%]" />
          <OverlayLink href="/paket-data" label="Paket Internet" className="left-[22.0%] top-[69.2%] h-[29.4%] w-[16.1%]" />
          <OverlayLink href="/listrik/token" label="Token Listrik" className="left-[39.6%] top-[69.2%] h-[29.4%] w-[16.1%]" />
          <OverlayLink href="/ewallet" label="E-Wallet" className="left-[57.4%] top-[69.2%] h-[29.4%] w-[16.1%]" />
          <OverlayLink href="/listrik/tagihan" label="Tagihan" className="left-[75.0%] top-[69.2%] h-[29.4%] w-[16.1%]" />
          <OverlayLink href="/kategori" label="Lainnya" className="left-[92.5%] top-[69.2%] h-[29.4%] w-[7.0%]" />
        </section>

        <section className="relative mt-[4.2%] px-[4.9%]">
          <AssetImage src="06_activity/activity_card_full.png" alt="Aktivitas terakhir Topuna" className="w-full" />
          <OverlayLink href="/transaksi" label="Lihat semua aktivitas" className="left-[78.7%] top-[4.9%] h-[12.8%] w-[17.8%]" />
        </section>

        <section className="relative mt-[3.0%] px-[4.8%]">
          <AssetImage src="07_promo/promo_banner_full.png" alt="Cashback spesial Topuna" className="w-full" />
          <OverlayLink href="/kategori" label="Lihat Promo" className="left-[76.0%] top-[24.1%] h-[61.1%] w-[20.0%]" />
        </section>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-[90] w-full max-w-md -translate-x-1/2 overflow-hidden md:w-97.5 md:max-w-none">
        <div className="relative">
          <AssetImage src="08_bottom_nav/bottom_nav_full.png" alt="Navigasi Topuna" className="w-full" />
          <OverlayLink href="/" label="Beranda" className="left-[6.8%] top-[40.3%] h-[37.0%] w-[14.1%]" />
          <OverlayLink href="/transaksi" label="Riwayat" className="left-[32.2%] top-[40.3%] h-[37.0%] w-[15.2%]" />
          <OverlayLink href="/user/saldo" label="Saldo" className="left-[56.7%] top-[40.3%] h-[37.0%] w-[13.4%]" />
          <OverlayLink href="/login" label="Akun" className="left-[81.3%] top-[40.3%] h-[37.0%] w-[12.3%]" />
        </div>
      </nav>
    </div>
  );
}
