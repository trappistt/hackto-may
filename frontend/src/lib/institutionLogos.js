export const TANGERINE_LOGO = {
  id: "tangerine",
  src: "/banks/tangerine.svg",
  alt: "Tangerine",
  match: (name) => /tangerine/i.test(name)
};

const INSTITUTIONS = [
  {
    id: "rbc",
    src: "/banks/rbc.png",
    alt: "RBC",
    match: (name) => /\brbc\b|royal bank of canada/i.test(name)
  },
  {
    id: "scotiabank",
    src: "/banks/scotiabank.svg",
    alt: "Scotiabank",
    match: (name) => /scotia|scotiabank/i.test(name)
  },
  TANGERINE_LOGO,
  {
    id: "cibc",
    src: "/banks/cibc.png",
    alt: "CIBC",
    match: (name) => /\bcibc\b/i.test(name)
  }
];

function isAutoLoan(name, type) {
  const label = String(name ?? "").toLowerCase();
  return type === "installment" || label.includes("auto");
}

export function resolveInstitutionLogo(name, type) {
  const label = String(name ?? "");

  if (isAutoLoan(label, type)) {
    return TANGERINE_LOGO;
  }

  return INSTITUTIONS.find((institution) => institution.match?.(label)) ?? null;
}

export const CONNECT_BANKS = [
  { name: "RBC", logo: "/banks/rbc.png", alt: "RBC" },
  { name: "Scotiabank", logo: "/banks/scotiabank.svg", alt: "Scotiabank" },
  { name: "Tangerine", logo: "/banks/tangerine.svg", alt: "Tangerine" },
  { name: "TD" },
  { name: "BMO" },
  { name: "CIBC", logo: "/banks/cibc.png", alt: "CIBC" }
];
