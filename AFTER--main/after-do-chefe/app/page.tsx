import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Sobre from "@/components/Sobre";
import LineUp from "@/components/LineUp";
import DataLocal from "@/components/DataLocal";
import Compra from "@/components/compra/Compra";
import Estrutura from "@/components/Estrutura";
import Galeria from "@/components/Galeria";
import Faq from "@/components/Faq";
import Contato from "@/components/Contato";
import Rodape from "@/components/Rodape";
import WhatsAppFlutuante from "@/components/WhatsAppFlutuante";
import DadosEstruturados from "@/components/DadosEstruturados";

/**
 * A ordem das seções segue a pergunta que a pessoa faz em cada momento:
 * o que é isso (hero, casa) -> quem toca (line-up) -> quando e onde ->
 * quanto custa (ingressos) -> o que tem lá -> como foi -> dúvidas -> contato.
 */
export default function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <Sobre />
        <LineUp />
        <DataLocal />
        <Compra />
        <Estrutura />
        <Galeria />
        <Faq />
        <Contato />
      </main>

      <Rodape />
      <WhatsAppFlutuante />
      <DadosEstruturados />
    </>
  );
}
