import type { Campaign } from "../../domain/product.js";
import { campaign as turknet } from "./turknet.js";
import { campaign as akbank } from "./akbank.js";
import { campaign as isbank } from "./isbank.js";
import { campaign as enpara_sirketim } from "./enpara-sirketim.js";
import { campaign as enpara_bireysel } from "./enpara-bireysel.js";
import { campaign as garanti_bbva } from "./garanti-bbva.js";
import { campaign as vodafone_avantajli } from "./vodafone-avantajli.js";
import { campaign as vodafone_red } from "./vodafone-red.js";
import { campaign as vodafone_freezone } from "./vodafone-freezone.js";
import { campaign as vodafone_ilk_hattim } from "./vodafone-ilk-hattim.js";
import { campaign as vodafone_ev_internet } from "./vodafone-ev-internet.js";
import { campaign as allianz_saglik } from "./allianz-saglik.js";
import { campaign as starbucks } from "./starbucks.js";
import { campaign as pegasus } from "./pegasus.js";
import { campaign as korendy } from "./korendy.js";
import { campaign as hugeicons_pro } from "./hugeicons-pro.js";
import { campaign as getir_finans } from "./getir-finans.js";

export const campaigns: Campaign[] = [
  turknet,
  akbank,
  isbank,
  enpara_sirketim,
  enpara_bireysel,
  garanti_bbva,
  vodafone_avantajli,
  vodafone_red,
  vodafone_freezone,
  vodafone_ilk_hattim,
  vodafone_ev_internet,
  allianz_saglik,
  starbucks,
  pegasus,
  korendy,
  hugeicons_pro,
  getir_finans,
];
