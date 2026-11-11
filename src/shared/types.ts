export interface Item {
  id: number;
  title: string;
  description: string;
  status: "Erledigt" | "In Arbeit" | "Offen";
}