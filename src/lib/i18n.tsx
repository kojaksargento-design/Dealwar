// DEALWAR i18n — lightweight provider with PT (default), EN and ES.
// Type-safe keys: `en` and `es` must declare every key that exists in `pt`.

import { createContext, useContext, useEffect, useState } from "react";
import { Languages } from "lucide-react";

export type Lang = "pt" | "en" | "es";

const pt = {
  // Hero + nav
  tagline: "A Guerra dos Preços",
  hero1: "Acha a promoção.",
  hero2: "Bate o preço.",
  hero3: "Ganha a guerra.",
  searchPlaceholder: "Procura um produto...",
  search: "Procurar",
  exploreWars: "EXPLORAR GUERRAS",
  createWar: "CRIAR GUERRA",
  enter: "Entrar",
  // How it works
  howItWorks: "Como funciona",
  step1: "Acha um produto",
  step1d: "Vês um produto com um preço que merece ser batido.",
  step2: "Lança a Guerra",
  step2d: "Define o preço a bater e abre o campo de batalha.",
  step3: "Caça o preço",
  step3d: "Os caçadores procuram mais barato e submetem com prova.",
  step4: "Partilha a vitória",
  step4d: "Gera o teu cartão de vitória e desafia toda a gente.",
  // Gamification
  gamifyTitle: "Ganha XP. Sobe de nível.",
  gamifySub: "Cada ação no campo de batalha rende pontos. Sobe de nível, desbloqueia emblemas e conquista o topo do ranking.",
  howToEarnXp: "Como ganhar XP",
  actCreateWar: "Lançar uma guerra",
  actJoinHunt: "Entrar numa caça",
  actDiscovery: "Descobrir um preço",
  actBeatPrice: "Bater o preço",
  actShare: "Partilhar a vitória",
  hunterLevels: "Níveis de caçador",
  badgesMissions: "Emblemas e missões",
  badgesLine1: "🏆 11 emblemas para desbloquear — da primeira guerra às caças lendárias.",
  badgesLine2: "🎯 5 missões diárias com recompensas em XP.",
  badgesLine3: "🔥 Streaks diários: entra todos os dias e não quebras a sequência.",
  badgesLine4: "⚔️ Guerra do Dia: uma batalha em destaque, todos os dias.",
  // Prize
  prizeTitle: "Compra pela app, recebe um prémio",
  prizeSub: "Quem compra um produto descoberto no DEALWAR recebe um prémio virtual exclusivo no perfil.",
  prizeLine1: "🥇 Emblema exclusivo «Vitória» no teu perfil",
  prizeLine2: "⚡ +250 XP para avançares de nível mais rápido",
  prizeLine3: "📜 Certificado de Comprador Verificado no teu cartão de caçador",
  prizeLine4: "🥇 Pódio exclusivo de compradores no ranking",
  prizeHowTitle: "Como reclamar",
  prizeHow1: "Compra o produto na loja onde caçaste o preço.",
  prizeHow2: "Submete o comprovativo (recibo ou print da encomenda).",
  prizeHow3: "A equipa verifica e o prémio fica disponível no teu perfil.",
  prizeCta: "RECLAMAR O MEU PRÉMIO",
  prizeVerifiedBadge: "Comprador Verificado",
  // Honesty rules
  rulesTitle: "Sem truques. Sem números falsos.",
  rule1: "Todos os preços submetidos ficam pendentes de verificação — nada é publicado sem aprovação.",
  rule2: "Prova obrigatória: link da loja e imagem. Sem prova, sem pontos.",
  rule3: "Os pontos (XP) são virtuais — não são dinheiro e não podem ser comprados.",
  rule4: "Os ganhos da plataforma começam em €0.00 e só crescem com conversões reais.",
  // Sections
  dailyWar: "Guerra do Dia",
  battleOfDay: "⚔️ Batalha do dia",
  original: "Original",
  bestVerified: "Melhor verificado",
  beatThisPrice: "BATE ESTE PREÇO",
  liveWars: "GUERRAS ATIVAS",
  seeAll: "Ver todas",
  noWars: "Ainda não há guerras.",
  noWarsSub: "Cria a primeira Guerra de Preços.",
  trending: "TENDÊNCIAS",
  more: "Mais",
  noTrending: "Ainda não há tendências — aparecem aqui à medida que os caçadores entram.",
  topHunters: "TOP CAÇADORES",
  noHunters: "Ainda não há caçadores no ranking. Sê o primeiro.",
  // CTA + footer
  ctaTitle: "Achas que encontras mais barato?",
  ctaSub: "Junta-te à comunidade de caçadores. Ganha XP, sobe no ranking global e vence a tua primeira Guerra de Preços hoje.",
  ctaJoin: "ENTRA NA GUERRA",
  footerNote: "Os pontos são virtuais e não representam dinheiro. Todos os valores de receita começam em €0.00 até existirem conversões reais.",
  footerBusiness: "Empresas",
  footerSettings: "Definições",
  // Victory claim page
  vcTitle: "Reclamar Prémio de Compra",
  vcSub: "Compraste um produto que descobriste no DEALWAR? Recebe o emblema «Vitória», +250 XP e o certificado de Comprador Verificado.",
  vcWar: "Guerra do produto",
  vcWarPh: "Escolhe a guerra",
  vcStore: "Onde compraste",
  vcStorePh: "Nome da loja (ex.: Worten, Fnac...)",
  vcAmount: "Valor pago",
  vcProof: "Link do comprovativo (recibo, fatura ou print)",
  vcProofPh: "https://... (imagem ou documento online)",
  vcNote: "Notas (opcional)",
  vcSubmit: "ENVIAR PARA VERIFICAÇÃO",
  vcSent: "Reclamação enviada! A equipa vai verificar.",
  vcSentDesc: "Ficas logo a saber quando o prémio for aprovado.",
  vcMustAuth: "Entra para reclamar o prémio",
  vcNeedJoin: "Tens de estar a participar na guerra do produto que compraste.",
  vcHistory: "As minhas reclamações",
  vcStatusPending: "Em análise",
  vcStatusApproved: "Aprovado 🏆",
  vcStatusRejected: "Recusado",
  // Admin tab
  vcAdminTitle: "Prémios de compra",
  vcAdminEmpty: "Sem reclamações pendentes.",
  vcApprove: "Aprovar",
  vcReject: "Recusar",
  // AppShell
  navHome: "INÍCIO",
  navExplore: "EXPLORAR",
  navTrending: "TENDÊNCIAS",
  navRanking: "RANKING",
  navBusiness: "NEGÓCIOS",
  navProfile: "PERFIL",
  navWars: "GUERRAS",
  navCreate: "CRIAR",
  navMissions: "MISSÕES",
  notifications: "Notificações",
  markAllRead: "Marcar tudo como lido",
  noNotifications: "Ainda sem notificações.",
  accountMenu: "Menu da conta",
  profile: "Perfil",
  settings: "Definições",
  ownerDashboard: "Painel do dono",
  signOut: "Terminar sessão",
  // Languages
  langPt: "Português",
  langEn: "English",
  langEs: "Español",
  chooseLang: "Idioma",
} as const;

type TKeys = keyof typeof pt;

const en: Record<TKeys, string> = {
  tagline: "The Price Battle",
  hero1: "Find a deal.",
  hero2: "Beat the price.",
  hero3: "Win the war.",
  searchPlaceholder: "Search a product...",
  search: "Search",
  exploreWars: "EXPLORE WARS",
  createWar: "CREATE WAR",
  enter: "Sign in",
  howItWorks: "How it works",
  step1: "Find a product",
  step1d: "Spot any product with a price worth beating.",
  step2: "Start a War",
  step2d: "Set the price to beat and open the battlefield.",
  step3: "Hunt the price",
  step3d: "Hunters search for lower prices and submit with proof.",
  step4: "Share your win",
  step4d: "Generate your win card and challenge everyone.",
  gamifyTitle: "Earn XP. Level up.",
  gamifySub: "Every action on the battlefield earns points. Level up, unlock badges and take the top of the ranking.",
  howToEarnXp: "How to earn XP",
  actCreateWar: "Start a war",
  actJoinHunt: "Join a hunt",
  actDiscovery: "Discover a price",
  actBeatPrice: "Beat the price",
  actShare: "Share a victory",
  hunterLevels: "Hunter levels",
  badgesMissions: "Badges & missions",
  badgesLine1: "🏆 11 badges to unlock — from your first war to legendary hunts.",
  badgesLine2: "🎯 5 daily missions with XP rewards.",
  badgesLine3: "🔥 Daily streaks: show up every day and keep the streak alive.",
  badgesLine4: "⚔️ Daily War: one featured battle, every day.",
  prizeTitle: "Buy through the app, earn a prize",
  prizeSub: "Anyone who buys a product discovered on DEALWAR earns an exclusive virtual prize on their profile.",
  prizeLine1: "🥇 Exclusive «Victory» badge on your profile",
  prizeLine2: "⚡ +250 XP to level up faster",
  prizeLine3: "📜 Verified Buyer certificate on your hunter card",
  prizeLine4: "🥇 Buyers-only podium in the ranking",
  prizeHowTitle: "How to claim",
  prizeHow1: "Buy the product at the store where you hunted the price.",
  prizeHow2: "Submit the proof (receipt or order screenshot).",
  prizeHow3: "The team verifies and the prize unlocks on your profile.",
  prizeCta: "CLAIM MY PRIZE",
  prizeVerifiedBadge: "Verified Buyer",
  rulesTitle: "No tricks. No fake numbers.",
  rule1: "Every submitted price stays pending until verified — nothing is published without approval.",
  rule2: "Proof is mandatory: store link and image. No proof, no points.",
  rule3: "Points (XP) are virtual — they are not money and cannot be bought.",
  rule4: "Platform earnings start at €0.00 and only grow with real conversions.",
  dailyWar: "Daily War",
  battleOfDay: "⚔️ Battle of the day",
  original: "Original",
  bestVerified: "Best verified",
  beatThisPrice: "BEAT THIS PRICE",
  liveWars: "LIVE WARS",
  seeAll: "See all",
  noWars: "No wars yet.",
  noWarsSub: "Create the first Price War.",
  trending: "TRENDING",
  more: "More",
  noTrending: "No trending wars yet — activity will appear here as hunters join.",
  topHunters: "TOP HUNTERS",
  noHunters: "No hunters ranked yet. Be the first.",
  ctaTitle: "Think you can find it cheaper?",
  ctaSub: "Join the community of hunters. Earn XP, climb the global ranking and win your first Price War today.",
  ctaJoin: "JOIN THE WAR",
  footerNote: "Points are virtual and do not represent money. All revenue metrics start at €0.00 until real conversions exist.",
  footerBusiness: "Business",
  footerSettings: "Settings",
  vcTitle: "Claim Purchase Prize",
  vcSub: "Bought a product you discovered on DEALWAR? Earn the «Victory» badge, +250 XP and the Verified Buyer certificate.",
  vcWar: "Product war",
  vcWarPh: "Choose the war",
  vcStore: "Where you bought it",
  vcStorePh: "Store name (e.g. Worten, Fnac...)",
  vcAmount: "Amount paid",
  vcProof: "Proof link (receipt, invoice or screenshot)",
  vcProofPh: "https://... (online image or document)",
  vcNote: "Notes (optional)",
  vcSubmit: "SUBMIT FOR VERIFICATION",
  vcSent: "Claim submitted! The team will verify it.",
  vcSentDesc: "You'll hear back as soon as the prize is approved.",
  vcMustAuth: "Sign in to claim your prize",
  vcNeedJoin: "You must be participating in the war of the product you bought.",
  vcHistory: "My claims",
  vcStatusPending: "Under review",
  vcStatusApproved: "Approved 🏆",
  vcStatusRejected: "Rejected",
  vcAdminTitle: "Purchase prizes",
  vcAdminEmpty: "No pending claims.",
  vcApprove: "Approve",
  vcReject: "Reject",
  navHome: "HOME",
  navExplore: "EXPLORE",
  navTrending: "TRENDING",
  navRanking: "RANKING",
  navBusiness: "BUSINESS",
  navProfile: "PROFILE",
  navWars: "WARS",
  navCreate: "CREATE",
  navMissions: "MISSIONS",
  notifications: "Notifications",
  markAllRead: "Mark all read",
  noNotifications: "No notifications yet.",
  accountMenu: "Account menu",
  profile: "Profile",
  settings: "Settings",
  ownerDashboard: "Owner dashboard",
  signOut: "Sign out",
  langPt: "Português",
  langEn: "English",
  langEs: "Español",
  chooseLang: "Language",
};

const es: Record<TKeys, string> = {
  tagline: "La Guerra de Precios",
  hero1: "Encuentra la oferta.",
  hero2: "Supera el precio.",
  hero3: "Gana la guerra.",
  searchPlaceholder: "Busca un producto...",
  search: "Buscar",
  exploreWars: "EXPLORAR GUERRAS",
  createWar: "CREAR GUERRA",
  enter: "Entrar",
  howItWorks: "Cómo funciona",
  step1: "Encuentra un producto",
  step1d: "Ves un producto con un precio que merece ser superado.",
  step2: "Lanza la Guerra",
  step2d: "Define el precio a superar y abre el campo de batalla.",
  step3: "Caza el precio",
  step3d: "Los cazadores buscan precios más bajos y los envían con prueba.",
  step4: "Comparte la victoria",
  step4d: "Genera tu tarjeta de victoria y desafía a todo el mundo.",
  gamifyTitle: "Gana XP. Sube de nivel.",
  gamifySub: "Cada acción en el campo de batalla da puntos. Sube de nivel, desbloquea insignias y conquista lo más alto del ranking.",
  howToEarnXp: "Cómo ganar XP",
  actCreateWar: "Lanzar una guerra",
  actJoinHunt: "Entrar en una caza",
  actDiscovery: "Descubrir un precio",
  actBeatPrice: "Superar el precio",
  actShare: "Compartir la victoria",
  hunterLevels: "Niveles de cazador",
  badgesMissions: "Insignias y misiones",
  badgesLine1: "🏆 11 insignias para desbloquear — de tu primera guerra a cazas legendarias.",
  badgesLine2: "🎯 5 misiones diarias con recompensas de XP.",
  badgesLine3: "🔥 Rachas diarias: entra cada día y no rompas la racha.",
  badgesLine4: "⚔️ Guerra del Día: una batalla destacada, cada día.",
  prizeTitle: "Compra en la app, gana un premio",
  prizeSub: "Quien compra un producto descubierto en DEALWAR recibe un premio virtual exclusivo en su perfil.",
  prizeLine1: "🥇 Insignia exclusiva «Victoria» en tu perfil",
  prizeLine2: "⚡ +250 XP para subir de nivel más rápido",
  prizeLine3: "📜 Certificado de Comprador Verificado en tu tarjeta de cazador",
  prizeLine4: "🥇 Podio exclusivo de compradores en el ranking",
  prizeHowTitle: "Cómo reclamar",
  prizeHow1: "Compra el producto en la tienda donde cazaste el precio.",
  prizeHow2: "Envía el comprobante (recibo o captura del pedido).",
  prizeHow3: "El equipo verifica y el premio se desbloquea en tu perfil.",
  prizeCta: "RECLAMAR MI PREMIO",
  prizeVerifiedBadge: "Comprador Verificado",
  rulesTitle: "Sin trucos. Sin números falsos.",
  rule1: "Todos los precios enviados quedan pendientes de verificación — nada se publica sin aprobación.",
  rule2: "Prueba obligatoria: enlace de la tienda e imagen. Sin prueba, sin puntos.",
  rule3: "Los puntos (XP) son virtuales — no son dinero y no se pueden comprar.",
  rule4: "Los ingresos de la plataforma empiezan en €0.00 y solo crecen con conversiones reales.",
  dailyWar: "Guerra del Día",
  battleOfDay: "⚔️ Batalla del día",
  original: "Original",
  bestVerified: "Mejor verificado",
  beatThisPrice: "SUPERA ESTE PRECIO",
  liveWars: "GUERRAS ACTIVAS",
  seeAll: "Ver todas",
  noWars: "Todavía no hay guerras.",
  noWarsSub: "Crea la primera Guerra de Precios.",
  trending: "TENDENCIAS",
  more: "Más",
  noTrending: "Todavía no hay tendencias — aparecerán aquí a medida que entren los cazadores.",
  topHunters: "TOP CAZADORES",
  noHunters: "Todavía no hay cazadores en el ranking. Sé el primero.",
  ctaTitle: "¿Crees que lo encuentras más barato?",
  ctaSub: "Únete a la comunidad de cazadores. Gana XP, sube en el ranking global y gana tu primera Guerra de Precios hoy.",
  ctaJoin: "ÚNETE A LA GUERRA",
  footerNote: "Los puntos son virtuales y no representan dinero. Todos los valores de ingresos empiezan en €0.00 hasta que existan conversiones reales.",
  footerBusiness: "Negocios",
  footerSettings: "Ajustes",
  vcTitle: "Reclamar Premio de Compra",
  vcSub: "¿Compraste un producto que descubriste en DEALWAR? Recibe la insignia «Victoria», +250 XP y el certificado de Comprador Verificado.",
  vcWar: "Guerra del producto",
  vcWarPh: "Elige la guerra",
  vcStore: "Dónde lo compraste",
  vcStorePh: "Nombre de la tienda (ej.: Worten, Fnac...)",
  vcAmount: "Importe pagado",
  vcProof: "Enlace del comprobante (recibo, factura o captura)",
  vcProofPh: "https://... (imagen o documento online)",
  vcNote: "Notas (opcional)",
  vcSubmit: "ENVIAR PARA VERIFICACIÓN",
  vcSent: "¡Reclamación enviada! El equipo la verificará.",
  vcSentDesc: "Sabrás enseguida cuando el premio sea aprobado.",
  vcMustAuth: "Entra para reclamar el premio",
  vcNeedJoin: "Debes estar participando en la guerra del producto que compraste.",
  vcHistory: "Mis reclamaciones",
  vcStatusPending: "En revisión",
  vcStatusApproved: "Aprobado 🏆",
  vcStatusRejected: "Rechazado",
  vcAdminTitle: "Premios de compra",
  vcAdminEmpty: "Sin reclamaciones pendientes.",
  vcApprove: "Aprobar",
  vcReject: "Rechazar",
  navHome: "INICIO",
  navExplore: "EXPLORAR",
  navTrending: "TENDENCIAS",
  navRanking: "RANKING",
  navBusiness: "NEGOCIOS",
  navProfile: "PERFIL",
  navWars: "GUERRAS",
  navCreate: "CREAR",
  navMissions: "MISIONES",
  notifications: "Notificaciones",
  markAllRead: "Marcar todo como leído",
  noNotifications: "Todavía sin notificaciones.",
  accountMenu: "Menú de cuenta",
  profile: "Perfil",
  settings: "Ajustes",
  ownerDashboard: "Panel del dueño",
  signOut: "Cerrar sesión",
  langPt: "Português",
  langEn: "English",
  langEs: "Español",
  chooseLang: "Idioma",
};

const DICTS: Record<Lang, Record<TKeys, string>> = { pt, en, es };

const STORAGE_KEY = "dealwar.lang";

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "pt" || saved === "en" || saved === "es") return saved;
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (nav === "en") return "en";
    if (nav === "es") return "es";
  } catch {
    // SSR / storage unavailable — fall through to default
  }
  return "pt";
}

type I18nContext = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKeys) => string;
};

const Ctx = createContext<I18nContext | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage unavailable — ignore
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: TKeys) => DICTS[lang][key];

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}

/** Language switcher (dropdown) for headers. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const LANGS: { code: Lang; label: string }[] = [
    { code: "pt", label: t("langPt") },
    { code: "en", label: t("langEn") },
    { code: "es", label: t("langEs") },
  ];
  return (
    <Dropdown>
      <DropdownTrigger className="glass-subtle flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Languages className="size-3.5" />
        {lang.toUpperCase()}
      </DropdownTrigger>
      <DropdownContent align="end" className="glass-strong">
        {LANGS.map((l) => (
          <DropdownItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={l.code === lang ? "font-bold text-primary" : ""}
          >
            {l.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// Local dropdown re-exports keep this file self-contained without pulling
// Radix types into every consumer.
import {
  DropdownMenu as Dropdown,
  DropdownMenuTrigger as DropdownTrigger,
  DropdownMenuContent as DropdownContent,
  DropdownMenuItem as DropdownItem,
} from "@/components/ui/dropdown-menu";
