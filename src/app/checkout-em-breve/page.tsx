import Link from "next/link";

// Destino do botão de compra enquanto NEXT_PUBLIC_CHECKOUT_URL não está configurada.

export const metadata = { title: "Checkout em configuração — ALPHA LAUNCH", robots: { index: false } };

export default function CheckoutEmBreve() {
  return (
    <main className="auth">
      <div className="auth__side">
        <span className="micro">CHECKOUT</span>
        <span className="wordmark auth__mark">ALPHA</span>
        <span className="auth__line">7-Day Build · Discover → Build → Ship</span>
      </div>
      <section className="auth__main">
        <h1 className="h1 auth__title enter">Checkout em configuração.</h1>
        <p className="lead enter">
          O pagamento ainda não está conectado. Quando a plataforma de checkout for definida, este botão leva direto para
          a compra.
        </p>
        <div className="enter">
          <Link className="btn btn--ghost" href="/">
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}
