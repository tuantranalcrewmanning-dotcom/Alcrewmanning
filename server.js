// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";

// db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// src/data/mockData.ts
var DIVISIONS = [
  {
    id: "k01",
    no: "01",
    name: "Kh\u1ED1i D\u1ECBch v\u1EE5 ngo\xE0i kh\u01A1i v\xE0 thuy\u1EC1n vi\xEAn",
    short: "Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    en: "Offshore Services & Crewing Division",
    color: "#17307A",
    accent: "#1FA3DC",
    email: "crewing@alcrewmanning.vn",
    lead: "\u0110\u1EA7u m\u1ED1i duy nh\u1EA5t cho ch\u1EE7 t\xE0u: cung \u1EE9ng thuy\u1EC1n vi\xEAn \u0111\u1EA1t chu\u1EA9n STCW v\xE0 MLC 2006, qu\u1EA3n l\xFD t\xE0u, d\u1ECBch v\u1EE5 h\u1ED7 tr\u1EE3 ngo\xE0i kh\u01A1i v\xE0 t\u01B0 v\u1EA5n ph\xE1p ch\u1EBF an to\xE0n h\xE0ng h\u1EA3i.",
    units: [
      {
        name: "Ph\xF2ng Tuy\u1EC3n d\u1EE5ng v\xE0 Cung \u1EE9ng thuy\u1EC1n vi\xEAn",
        en: "Seafarer Recruitment and Placement Services (SRPS)",
        desc: "Tuy\u1EC3n ch\u1ECDn, th\u1EA9m \u0111\u1ECBnh v\xE0 b\u1ED1 tr\xED s\u0129 quan, thuy\u1EC1n vi\xEAn cho \u0111\u1ED9i t\xE0u trong n\u01B0\u1EDBc v\xE0 qu\u1ED1c t\u1EBF theo quy tr\xECnh SRPS ph\xF9 h\u1EE3p c\xF4ng \u01B0\u1EDBc MLC 2006.",
        pts: [
          "Cung \u1EE9ng theo ch\u1EE9c danh \u0111\u01A1n l\u1EBB ho\u1EB7c tr\u1ECDn b\u1ED9 thuy\u1EC1n vi\xEAn",
          "Th\u1EA9m \u0111\u1ECBnh nghi\xEAm ng\u1EB7t ch\u1EE9ng ch\u1EC9 STCW v\xE0 kinh nghi\u1EC7m \u0111i bi\u1EC3n th\u1EF1c t\u1EBF",
          "Kh\xE1m s\u1EE9c kho\u1EBB \u0111\u1EA1t chu\u1EA9n P&I, h\u1ED3 s\u01A1 xu\u1EA5t c\u1EA3nh, \u0111\xF3n t\xE0u t\u1EA1i c\u1EA3ng qu\u1ED1c t\u1EBF",
          "L\u1EADp k\u1EBF ho\u1EA1ch thay ca \u0111\u1ECBnh k\u1EF3 v\xE0 qu\u1EA3n l\xFD h\u1EE3p \u0111\u1ED3ng thuy\u1EC1n vi\xEAn"
        ]
      },
      {
        name: "Ph\xF2ng Qu\u1EA3n l\xFD t\xE0u",
        en: "Ship Management Department",
        desc: "Qu\u1EA3n l\xFD k\u1EF9 thu\u1EADt, an to\xE0n v\xE0 thuy\u1EC1n b\u1ED9 thay m\u1EB7t ch\u1EE7 t\xE0u, duy tr\xEC t\xECnh tr\u1EA1ng t\xE0u lu\xF4n s\u1EB5n s\xE0ng khai th\xE1c th\u01B0\u01A1ng m\u1EA1i.",
        pts: [
          "Gi\xE1m s\xE1t b\u1EA3o d\u01B0\u1EE1ng v\u1ECF t\xE0u, m\xE1y m\xF3c v\xE0 s\u1EEDa ch\u1EEFa \u0111\u1ECBnh k\u1EF3 dock",
          "H\u1EC7 th\u1ED1ng qu\u1EA3n l\xFD an to\xE0n ISM Code, an ninh ISPS Code",
          "Chu\u1EA9n b\u1ECB ki\u1EC3m tra \u0111\u0103ng ki\u1EC3m qu\u1ED1c t\u1EBF, PSC (Port State Control)",
          "B\xE1o c\xE1o v\u1EADn h\xE0nh k\u1EF9 thu\u1EADt v\xE0 nhi\xEAn li\u1EC7u \u0111\u1ECBnh k\u1EF3 cho ch\u1EE7 t\xE0u"
        ]
      },
      {
        name: "Ph\xF2ng Th\u1EF1c thi d\u1ECBch v\u1EE5 h\u1ED7 tr\u1EE3 ngo\xE0i kh\u01A1i",
        en: "Offshore Supporting Services Department",
        desc: "Cung c\u1EA5p nh\xE2n l\u1EF1c chuy\xEAn tr\xE1ch v\xE0 d\u1ECBch v\u1EE5 h\u1ED7 tr\u1EE3 cho ho\u1EA1t \u0111\u1ED9ng ngo\xE0i kh\u01A1i, gi\xE0n khoan v\xE0 t\xE0u d\u1ECBch v\u1EE5 d\u1EA7u kh\xED.",
        pts: [
          "Cung \u1EE9ng nh\xE2n s\u1EF1 v\u1EADn h\xE0nh t\xE0u k\xE9o, t\xE0u d\u1ECBch v\u1EE5 AHTS, gi\xE0n khoan",
          "H\u1ED7 tr\u1EE3 h\u1EADu c\u1EA7n k\u1EF9 thu\u1EADt v\xE0 thay ca an to\xE0n ngo\xE0i kh\u01A1i",
          "Ph\u1ED1i h\u1EE3p quy tr\xECnh an to\xE0n nghi\xEAm ng\u1EB7t v\u1EDBi Ph\xF2ng OHS"
        ]
      },
      {
        name: "Ph\xF2ng T\u01B0 v\u1EA5n ph\xE1p ch\u1EBF an to\xE0n t\xE0u",
        en: "Ship Safety & Legal Advisory Department",
        desc: "T\u01B0 v\u1EA5n tu\xE2n th\u1EE7 c\xF4ng \u01B0\u1EDBc qu\u1ED1c t\u1EBF v\xE0 gi\u1EA3i quy\u1EBFt c\xE1c v\u1EA5n \u0111\u1EC1 ph\xE1p l\xFD h\xE0ng h\u1EA3i cho ch\u1EE7 t\xE0u v\xE0 thuy\u1EC1n vi\xEAn.",
        pts: [
          "T\u01B0 v\u1EA5n tu\xE2n th\u1EE7 SOLAS, MARPOL, MLC 2006, STCW s\u1EEDa \u0111\u1ED5i",
          "Chu\u1EA9n b\u1ECB ki\u1EC3m tra PSC v\xE0 Vetting c\u1EE7a c\xE1c t\u1EADp \u0111o\xE0n d\u1EA7u kh\xED",
          "T\u01B0 v\u1EA5n h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng thuy\u1EC1n vi\xEAn, b\u1EA3o hi\u1EC3m P&I v\xE0 h\u1ED3i h\u01B0\u01A1ng"
        ]
      }
    ],
    steps: [
      { title: "Ti\u1EBFp nh\u1EADn y\xEAu c\u1EA7u", desc: "Ch\u1EE9c danh, lo\u1EA1i t\xE0u, tuy\u1EBFn ch\u1EA1y, th\u1EDDi \u0111i\u1EC3m \u0111\xF3n t\xE0u" },
      { title: "Tuy\u1EC3n ch\u1ECDn & Ph\u1ECFng v\u1EA5n", desc: "S\xE0ng l\u1ECDc h\u1ED3 s\u01A1, ki\u1EC3m tra ph\u1ECFng v\u1EA5n chuy\xEAn m\xF4n" },
      { title: "Th\u1EA9m \u0111\u1ECBnh h\u1ED3 s\u01A1", desc: "Ki\u1EC3m tra ch\u1EE9ng ch\u1EC9 STCW, kinh nghi\u1EC7m v\xE0 kh\xE1m s\u1EE9c kh\u1ECFe" },
      { title: "Hu\u1EA5n luy\u1EC7n b\u1ED5 sung", desc: "Ph\u1ED1i h\u1EE3p TT Hu\u1EA5n luy\u1EC7n Kh\u1ED1i 02 b\u1ED3i d\u01B0\u1EE1ng tr\u01B0\u1EDBc khi l\xEAn t\xE0u", isPartner: true },
      { title: "B\u1ED1 tr\xED l\xEAn t\xE0u", desc: "K\xFD k\u1EBFt h\u1EE3p \u0111\u1ED3ng chu\u1EA9n MLC, xu\u1EA5t c\u1EA3nh, \u0111\xF3n t\xE0u an to\xE0n" },
      { title: "Theo d\xF5i & Thay ca", desc: "\u0110\xE1nh gi\xE1 n\u0103ng l\u1EF1c, b\u1EA3o h\u1ED9 OHS, ch\u1EBF \u0111\u1ED9 h\u1ED3i h\u01B0\u01A1ng", isPartner: true }
    ],
    related: [
      { divId: "k02", unitIndex: 0 },
      { divId: "k02", unitIndex: 3 },
      { divId: "k05", unitIndex: 2 }
    ]
  },
  {
    id: "k02",
    no: "02",
    name: "Kh\u1ED1i \u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    short: "\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    en: "Education & Training Division",
    color: "#0A6E9E",
    accent: "#8FD3F2",
    email: "daotao@alcrewmanning.vn",
    lead: "Chu\u1EA9n b\u1ECB \u0111\u1EA7y \u0111\u1EE7 n\u0103ng l\u1EF1c cho thuy\u1EC1n vi\xEAn v\xE0 ng\u01B0\u1EDDi lao \u0111\u1ED9ng tr\u01B0\u1EDBc khi xu\u1EA5t c\u1EA3nh: ch\u1EE9ng ch\u1EC9 chuy\xEAn m\xF4n STCW, ngo\u1EA1i ng\u1EEF h\xE0ng h\u1EA3i, tin h\u1ECDc, k\u1EF9 n\u0103ng \u1EE9ng d\u1EE5ng AI v\xE0 gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng.",
    units: [
      {
        name: "Trung t\xE2m Hu\u1EA5n luy\u1EC7n thuy\u1EC1n vi\xEAn \xC2u L\u1EA1c",
        en: "Aulac Crew Training Centre",
        desc: "Hu\u1EA5n luy\u1EC7n, b\u1ED3i d\u01B0\u1EE1ng nghi\u1EC7p v\u1EE5 chuy\xEAn s\xE2u cho thuy\u1EC1n vi\xEAn theo y\xEAu c\u1EA7u c\u1EE7a ch\u1EE7 t\xE0u v\xE0 ti\xEAu chu\u1EA9n STCW 78/2010.",
        pts: [
          "Kho\xE1 hu\u1EA5n luy\u1EC7n an to\xE0n c\u01A1 b\u1EA3n v\xE0 n\xE2ng cao (STCW)",
          "Hu\u1EA5n luy\u1EC7n nghi\u1EC7p v\u1EE5 t\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m, t\xE0u h\xF3a ch\u1EA5t v\xE0 kh\xED l\u1ECFng",
          "\u0110\xE1nh gi\xE1 v\xE0 ki\u1EC3m tra n\u0103ng l\u1EF1c m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i / bu\u1ED3ng m\xE1y"
        ]
      },
      {
        name: "Trung t\xE2m \u0110\xE0o t\u1EA1o ngo\u1EA1i ng\u1EEF tin h\u1ECDc \xC2u L\u1EA1c",
        en: "Aulac Language & IT Training Centre",
        desc: "\u0110\xE0o t\u1EA1o ti\u1EBFng Anh h\xE0ng h\u1EA3i, ngo\u1EA1i ng\u1EEF cho ng\u01B0\u1EDDi lao \u0111\u1ED9ng \u0111i l\xE0m vi\u1EC7c n\u01B0\u1EDBc ngo\xE0i v\xE0 tin h\u1ECDc v\u0103n ph\xF2ng \u1EE9ng d\u1EE5ng.",
        pts: [
          "Ti\u1EBFng Anh h\xE0ng h\u1EA3i theo chu\u1EA9n IMO Model Course (Maritime English)",
          "\u0110\xE0o t\u1EA1o ti\u1EBFng Nh\u1EADt (N4, N3), ti\u1EBFng H\xE0n (EPS-TOPIK), ti\u1EBFng \u0110\u1EE9c (B1)",
          "Tin h\u1ECDc \u1EE9ng d\u1EE5ng qu\u1EA3n l\xFD v\u0103n ph\xF2ng v\xE0 nh\u1EADt k\xFD t\xE0u"
        ]
      },
      {
        name: "Trung t\xE2m \u0110\xE0o t\u1EA1o \u1EE9ng d\u1EE5ng tr\xED tu\u1EC7 nh\xE2n t\u1EA1o \xC2u L\u1EA1c",
        en: "Aulac AI Application Training Centre",
        desc: "Trang b\u1ECB k\u1EF9 n\u0103ng s\u1EED d\u1EE5ng c\xE1c c\xF4ng c\u1EE5 AI trong x\u1EED l\xFD d\u1EEF li\u1EC7u, qu\u1EA3n l\xFD v\u1EADn h\xE0nh h\xE0ng h\u1EA3i v\xE0 h\u1ECDc t\u1EADp s\u1ED1.",
        pts: [
          "\u1EE8ng d\u1EE5ng AI h\u1ED7 tr\u1EE3 ph\xE2n t\xEDch d\u1EEF li\u1EC7u h\u1EA3i tr\xECnh v\xE0 t\u1ED1i \u01B0u h\xF3a v\u1EADn h\xE0nh",
          "\u1EE8ng d\u1EE5ng AI so\u1EA1n th\u1EA3o t\xE0i li\u1EC7u, qu\u1EA3n l\xFD h\u1ED3 s\u01A1 v\xE0 n\xE2ng cao hi\u1EC7u su\u1EA5t",
          "Kho\xE1 b\u1ED3i d\u01B0\u1EE1ng ng\u1EAFn h\u1EA1n k\u1EF9 n\u0103ng s\u1ED1 cho doanh nghi\u1EC7p h\xE0ng h\u1EA3i"
        ]
      },
      {
        name: "Ph\xF2ng Gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng",
        en: "Orientation Education Department",
        desc: "Gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng b\u1EAFt bu\u1ED9c tr\u01B0\u1EDBc khi xu\u1EA5t c\u1EA3nh: ph\xE1p lu\u1EADt n\u01B0\u1EDBc s\u1EDF t\u1EA1i, phong t\u1EE5c t\u1EADp qu\xE1n, k\u1EF7 lu\u1EADt lao \u0111\u1ED9ng v\xE0 an to\xE0n.",
        pts: [
          "Ph\xE1p lu\u1EADt n\u01B0\u1EDBc ti\u1EBFp nh\u1EADn lao \u0111\u1ED9ng, n\u1ED9i dung h\u1EE3p \u0111\u1ED3ng v\xE0 ch\u1EBF \u0111\u1ED9 b\u1EA3o hi\u1EC3m",
          "V\u0103n ho\xE1 \u1EE9ng x\u1EED, k\u1EF7 lu\u1EADt lao \u0111\u1ED9ng tr\xEAn t\xE0u v\xE0 t\u1EA1i nh\xE0 m\xE1y qu\u1ED1c t\u1EBF",
          "Quy\u1EC1n l\u1EE3i v\xE0 ngh\u0129a v\u1EE5 theo c\xF4ng \u01B0\u1EDBc MLC 2006"
        ]
      }
    ],
    steps: [
      { title: "T\u01B0 v\u1EA5n kh\xF3a h\u1ECDc", desc: "\u0110\xE1nh gi\xE1 n\u0103ng l\u1EF1c \u0111\u1EA7u v\xE0o v\xE0 \u0111\xEDch \u0111\u1EBFn ngh\u1EC1 nghi\u1EC7p" },
      { title: "\u0110\u0103ng k\xFD & X\u1EBFp l\u1EDBp", desc: "Ki\u1EC3m tra tr\xECnh \u0111\u1ED9, x\u1EBFp l\u1EDBp theo c\u1EA5p \u0111\u1ED9 ph\xF9 h\u1EE3p" },
      { title: "H\u1ECDc l\xFD thuy\u1EBFt & M\xF4 ph\u1ECFng", desc: "\u0110\xE0o t\u1EA1o k\u1EBFt h\u1EE3p th\u1EF1c h\xE0nh tr\xEAn h\u1EC7 th\u1ED1ng m\xF4 ph\u1ECFng" },
      { title: "\u0110\xE1nh gi\xE1 cu\u1ED1i kh\xF3a", desc: "Ki\u1EC3m tra tay ngh\u1EC1, b\xE0i thi chu\u1EA9n h\xF3a STCW / ngo\u1EA1i ng\u1EEF" },
      { title: "C\u1EA5p ch\u1EE9ng ch\u1EC9", desc: "C\u1EA5p gi\u1EA5y ch\u1EE9ng nh\u1EADn h\u1EE3p l\u1EC7 theo quy \u0111\u1ECBnh nh\xE0 n\u01B0\u1EDBc" },
      { title: "K\u1EBFt n\u1ED1i vi\u1EC7c l\xE0m", desc: "Chuy\u1EC3n th\xF4ng tin \u1EE9ng vi\xEAn sang Kh\u1ED1i 01 / Kh\u1ED1i 03", isPartner: true }
    ],
    related: [
      { divId: "k01", unitIndex: 0 },
      { divId: "k03", unitIndex: 0 },
      { divId: "k04", unitIndex: 0 }
    ]
  },
  {
    id: "k03",
    no: "03",
    name: "Kh\u1ED1i Xu\u1EA5t kh\u1EA9u ngu\u1ED3n l\u1EF1c",
    short: "Xu\u1EA5t kh\u1EA9u ngu\u1ED3n l\u1EF1c",
    en: "Overseas Labour Operations Division",
    color: "#2A4BA8",
    accent: "#8FD3F2",
    email: "laodong@alcrewmanning.vn",
    lead: "\u0110\u01B0a lao \u0111\u1ED9ng Vi\u1EC7t Nam c\xF3 tay ngh\u1EC1, k\u1EF9 s\u01B0, \u0111i\u1EC1u d\u01B0\u1EE1ng sang l\xE0m vi\u1EC7c t\u1EA1i Nh\u1EADt B\u1EA3n, H\xE0n Qu\u1ED1c, CHLB \u0110\u1EE9c; \u0111\u1ED3ng th\u1EDDi k\u1EBFt n\u1ED1i chuy\xEAn gia n\u01B0\u1EDBc ngo\xE0i l\xE0m vi\u1EC7c t\u1EA1i Vi\u1EC7t Nam.",
    units: [
      {
        name: "Ph\xF2ng Nghi\u1EC7p v\u1EE5 qu\u1EA3n l\xFD lao \u0111\u1ED9ng n\u01B0\u1EDBc ngo\xE0i",
        en: "Overseas Labour Management Department",
        desc: "T\xECm ki\u1EBFm c\u01A1 h\u1ED9i ngh\u1EC1 nghi\u1EC7p qu\u1ED1c t\u1EBF uy t\xEDn, tuy\u1EC3n ch\u1ECDn, ho\xE0n thi\u1EC7n h\u1ED3 s\u01A1 visa v\xE0 qu\u1EA3n l\xFD b\u1EA3o v\u1EC7 ng\u01B0\u1EDDi lao \u0111\u1ED9ng trong su\u1ED1t th\u1EDDi gian l\xE0m vi\u1EC7c t\u1EA1i n\u01B0\u1EDBc ngo\xE0i.",
        pts: [
          "Khai th\xE1c c\u01A1 h\u1ED9i ngh\u1EC1 nghi\u1EC7p v\xE0 ch\u01B0\u01A1ng tr\xECnh tuy\u1EC3n d\u1EE5ng tr\u1EF1c ti\u1EBFp t\u1EEB nghi\u1EC7p \u0111o\xE0n, doanh nghi\u1EC7p ti\u1EBFp nh\u1EADn uy t\xEDn",
          "T\u1ED5 ch\u1EE9c thi tuy\u1EC3n, ph\u1ECFng v\u1EA5n tay ngh\u1EC1 tr\u1EF1c ti\u1EBFp ho\u1EB7c online",
          "Th\u1EF1c hi\u1EC7n th\u1EE7 t\u1EE5c xin visa, k\xFD h\u1EE3p \u0111\u1ED3ng v\xE0 t\u1ED5 ch\u1EE9c xu\u1EA5t c\u1EA3nh",
          "Theo d\xF5i, b\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i h\u1EE3p ph\xE1p c\u1EE7a ng\u01B0\u1EDDi lao \u0111\u1ED9ng t\u1EA1i n\u01B0\u1EDBc s\u1EDF t\u1EA1i"
        ]
      },
      {
        name: "Ph\xF2ng Gi\u1EDBi thi\u1EC7u chuy\xEAn gia n\u01B0\u1EDBc ngo\xE0i l\xE0m vi\u1EC7c t\u1EA1i Vi\u1EC7t Nam",
        en: "Foreign Expert Placement in Vietnam Department",
        desc: "K\u1EBFt n\u1ED1i doanh nghi\u1EC7p Vi\u1EC7t Nam v\u1EDBi c\xE1c chuy\xEAn gia, k\u1EF9 s\u01B0 k\u1EF9 thu\u1EADt cao n\u01B0\u1EDBc ngo\xE0i; h\u1ED7 tr\u1EE3 to\xE0n di\u1EC7n th\u1EE7 t\u1EE5c gi\u1EA5y ph\xE9p lao \u0111\u1ED9ng.",
        pts: [
          "T\xECm ki\u1EBFm v\xE0 k\u1EBFt n\u1ED1i chuy\xEAn gia theo y\xEAu c\u1EA7u k\u1EF9 thu\u1EADt c\u1EE7a doanh nghi\u1EC7p",
          "Th\u1EF1c hi\u1EC7n th\u1EE7 t\u1EE5c xin c\u1EA5p Gi\u1EA5y ph\xE9p lao \u0111\u1ED9ng (Work Permit) v\xE0 Th\u1EBB t\u1EA1m tr\xFA",
          "H\u1ED7 tr\u1EE3 chuy\xEAn gia \u1ED5n \u0111\u1ECBnh sinh ho\u1EA1t, l\xE0m vi\u1EC7c l\xE2u d\xE0i t\u1EA1i Vi\u1EC7t Nam"
        ]
      }
    ],
    steps: [
      { title: "T\u01B0 v\u1EA5n ngh\u1EC1 nghi\u1EC7p & XKL\u0110", desc: "Gi\u1EDBi thi\u1EC7u ng\xE0nh ngh\u1EC1, qu\u1ED1c gia, m\u1EE9c l\u01B0\u01A1ng minh b\u1EA1ch" },
      { title: "S\u01A1 tuy\u1EC3n & Thi tuy\u1EC3n", desc: "Ki\u1EC3m tra th\u1EC3 l\u1EF1c, tay ngh\u1EC1 v\xE0 ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp" },
      { title: "Ngo\u1EA1i ng\u1EEF & \u0110\u1ECBnh h\u01B0\u1EDBng", desc: "\u0110\xE0o t\u1EA1o ti\u1EBFng b\u1EA3n ng\u1EEF v\xE0 v\u0103n h\xF3a t\u1EA1i Kh\u1ED1i 02", isPartner: true },
      { title: "Ho\xE0n thi\u1EC7n h\u1ED3 s\u01A1 & Visa", desc: "Xin t\u01B0 c\xE1ch l\u01B0u tr\xFA, k\xFD k\u1EBFt h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng" },
      { title: "Xu\u1EA5t c\u1EA3nh & Qu\u1EA3n l\xFD", desc: "\u0110\xF3n t\u1EA1i s\xE2n bay, theo d\xF5i h\u1ED7 tr\u1EE3 su\u1ED1t th\u1EDDi h\u1EA1n h\u1EE3p \u0111\u1ED3ng" },
      { title: "\u0110\xF3n ti\u1EBFp v\u1EC1 n\u01B0\u1EDBc", desc: "Ph\u1ED1i h\u1EE3p Kh\u1ED1i 05 h\u1ED7 tr\u1EE3 thanh l\xFD H\u0110, gi\u1EDBi thi\u1EC7u vi\u1EC7c l\xE0m m\u1EDBi", isPartner: true }
    ],
    related: [
      { divId: "k02", unitIndex: 1 },
      { divId: "k02", unitIndex: 3 },
      { divId: "k05", unitIndex: 1 }
    ]
  },
  {
    id: "k04",
    no: "04",
    name: "Trung t\xE2m T\u01B0 v\u1EA5n du h\u1ECDc \xC2u L\u1EA1c",
    short: "T\u01B0 v\u1EA5n du h\u1ECDc \xC2u L\u1EA1c",
    en: "Aulac Study Abroad Consulting Centre",
    color: "#1FA3DC",
    accent: "#0E1F4D",
    email: "duhoc@alcrewmanning.vn",
    lead: "T\u01B0 v\u1EA5n l\u1ED9 tr\xECnh du h\u1ECDc ngh\u1EC1 v\xE0 du h\u1ECDc \u0111\u1EA1i h\u1ECDc tr\u1ECDn g\xF3i: ch\u1ECDn tr\u01B0\u1EDDng, ch\u1ECDn ng\xE0nh, chu\u1EA9n b\u1ECB ngo\u1EA1i ng\u1EEF, ho\xE0n thi\u1EC7n h\u1ED3 s\u01A1 visa v\xE0 \u0111\u1ED3ng h\xE0nh su\u1ED1t qu\xE1 tr\xECnh h\u1ECDc t\u1EADp.",
    units: [
      {
        name: "T\u01B0 v\u1EA5n ch\u1ECDn qu\u1ED1c gia v\xE0 tr\u01B0\u1EDDng h\u1ECDc",
        en: "Destination & School Advisory Department",
        desc: "\u0110\xE1nh gi\xE1 n\u0103ng l\u1EF1c h\u1ECDc t\u1EADp, t\xE0i ch\xEDnh v\xE0 \u0111\u1ECBnh h\u01B0\u1EDBng ngh\u1EC1 nghi\u1EC7p d\xE0i h\u1EA1n \u0111\u1EC3 x\xE2y d\u1EF1ng l\u1ED9 tr\xECnh du h\u1ECDc ph\xF9 h\u1EE3p nh\u1EA5t.",
        pts: [
          "T\u01B0 v\u1EA5n chuy\xEAn s\xE2u 1-1 c\xF9ng h\u1ECDc sinh v\xE0 ph\u1EE5 huynh",
          "So s\xE1nh h\u1ECDc ph\xED, chi ph\xED sinh ho\u1EA1t v\xE0 c\u01A1 h\u1ED9i h\u1ECDc b\u1ED5ng",
          "L\u1ED9 tr\xECnh du h\u1ECDc ngh\u1EC1 k\xE9p mi\u1EC5n h\u1ECDc ph\xED, c\xF3 l\u01B0\u01A1ng th\u1EF1c t\u1EADp t\u1EA1i CHLB \u0110\u1EE9c"
        ]
      },
      {
        name: "H\u1ED3 s\u01A1, visa v\xE0 chu\u1EA9n b\u1ECB ngo\u1EA1i ng\u1EEF",
        en: "Application, Visa & Language Preparation Department",
        desc: "Ho\xE0n thi\u1EC7n to\xE0n b\u1ED9 h\u1ED3 s\u01A1 nh\u1EADp h\u1ECDc, xin visa \u0111\u1EA1i s\u1EE9 qu\xE1n v\xE0 r\xE8n luy\u1EC7n ngo\u1EA1i ng\u1EEF c\xF9ng Kh\u1ED1i \u0110\xE0o t\u1EA1o \xC2u L\u1EA1c.",
        pts: [
          "D\u1ECBch thu\u1EADt c\xF4ng ch\u1EE9ng, ho\xE0n thi\u1EC7n th\u01B0 \u0111\u1ED9ng l\u1EF1c v\xE0 h\u1ED3 s\u01A1 t\xE0i ch\xEDnh",
          "Luy\u1EC7n ph\u1ECFng v\u1EA5n visa v\u1EDBi t\u1EC9 l\u1EC7 \u0111\u1ED7 visa cao",
          "H\u1ED7 tr\u1EE3 \u0111\u1EB7t v\xE9 m\xE1y bay, b\u1EA3o hi\u1EC3m du h\u1ECDc v\xE0 t\xECm ki\u1EBFm ch\u1ED7 \u1EDF ban \u0111\u1EA7u"
        ]
      }
    ],
    steps: [
      { title: "T\u01B0 v\u1EA5n l\u1ED9 tr\xECnh", desc: "X\xE1c \u0111\u1ECBnh m\u1EE5c ti\xEAu h\u1ECDc t\u1EADp, ng\xE2n s\xE1ch v\xE0 s\u1EDF tr\u01B0\u1EDDng" },
      { title: "Ch\u1ECDn tr\u01B0\u1EDDng & Ng\xE0nh", desc: "N\u1ED9p h\u1ED3 s\u01A1 xin th\u01B0 m\u1EDDi nh\u1EADp h\u1ECDc ch\xEDnh th\u1EE9c" },
      { title: "\u0110\xE0o t\u1EA1o ngo\u1EA1i ng\u1EEF", desc: "H\u1ECDc ngo\u1EA1i ng\u1EEF v\xE0 luy\u1EC7n thi ch\u1EE9ng ch\u1EC9 t\u1EA1i Kh\u1ED1i 02", isPartner: true },
      { title: "H\u1ED3 s\u01A1 & Ph\u1ECFng v\u1EA5n Visa", desc: "Ho\xE0n thi\u1EC7n h\u1ED3 s\u01A1 t\xE0i ch\xEDnh v\xE0 luy\u1EC7n ph\u1ECFng v\u1EA5n" },
      { title: "Nh\u1EADp h\u1ECDc & \u1ED4n \u0111\u1ECBnh", desc: "H\u1ED7 tr\u1EE3 \u0111\u01B0a \u0111\xF3n s\xE2n bay, \u0111\u0103ng k\xFD t\u1EA1m tr\xFA v\xE0 nh\xE0 \u1EDF" },
      { title: "\u0110\u1ED3ng h\xE0nh d\xE0i h\u1EA1n", desc: "H\u1ED7 tr\u1EE3 trong su\u1ED1t qu\xE1 tr\xECnh h\u1ECDc t\u1EADp v\xE0 xin vi\u1EC7c sau t\u1ED1t nghi\u1EC7p" }
    ],
    related: [
      { divId: "k02", unitIndex: 1 },
      { divId: "k03", unitIndex: 0 }
    ]
  },
  {
    id: "k05",
    no: "05",
    name: "Kh\u1ED1i H\u1ED7 tr\u1EE3",
    short: "Kh\u1ED1i H\u1ED7 tr\u1EE3",
    en: "Support Functions Division",
    color: "#0E1F4D",
    accent: "#1FA3DC",
    email: "hotro@alcrewmanning.vn",
    lead: "B\u1EA3o \u0111\u1EA3m an to\xE0n ngh\u1EC1 nghi\u1EC7p cho ng\u01B0\u1EDDi lao \u0111\u1ED9ng trong su\u1ED1t chuy\u1EBFn h\u1EA3i tr\xECnh v\xE0 th\u1EDDi gian l\xE0m vi\u1EC7c \u1EDF n\u01B0\u1EDBc ngo\xE0i; \u0111\u1ED3ng h\xE0nh h\u1ED7 tr\u1EE3 khi v\u1EC1 n\u01B0\u1EDBc v\xE0 v\u1EADn h\xE0nh qu\u1EA3n tr\u1ECB.",
    units: [
      {
        name: "Ph\xF2ng H\xE0nh ch\xEDnh v\xE0 K\u1EBF to\xE1n",
        en: "Administration, HR & Accounting Department",
        desc: "V\u1EADn h\xE0nh c\xF4ng t\xE1c h\xE0nh ch\xEDnh, nh\xE2n s\u1EF1, t\xE0i ch\xEDnh k\u1EBF to\xE1n n\u1ED9i b\u1ED9 v\xE0 qu\u1EA3n l\xFD tuy\u1EC3n d\u1EE5ng nh\xE2n s\u1EF1 v\u0103n ph\xF2ng cho ALCM.",
        pts: [
          "Tuy\u1EC3n d\u1EE5ng v\xE0 b\u1ED3i d\u01B0\u1EE1ng nh\xE2n s\u1EF1 kh\u1ED1i v\u0103n ph\xF2ng",
          "Th\u1EF1c hi\u1EC7n thanh to\xE1n, ch\u1EE9ng t\u1EEB t\xE0i ch\xEDnh minh b\u1EA1ch cho \u0111\u1ED1i t\xE1c",
          "Qu\u1EA3n l\xFD h\u1EC7 th\u1ED1ng l\u01B0u tr\u1EEF th\xF4ng tin n\u1ED9i b\u1ED9 b\u1EA3o m\u1EADt"
        ]
      },
      {
        name: "Ph\xF2ng H\u1ED7 tr\u1EE3 lao \u0111\u1ED9ng v\u1EC1 n\u01B0\u1EDBc",
        en: "Returned Labour Support Department",
        desc: "H\u1ED7 tr\u1EE3 th\u1EE7 t\u1EE5c ph\xE1p l\xFD, b\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i b\u1EA3o hi\u1EC3m v\xE0 k\u1EBFt n\u1ED1i t\xE1i ho\xE0 nh\u1EADp vi\u1EC7c l\xE0m cho thuy\u1EC1n vi\xEAn, ng\u01B0\u1EDDi lao \u0111\u1ED9ng sau khi k\u1EBFt th\xFAc h\u1EE3p \u0111\u1ED3ng.",
        pts: [
          "Thanh l\xFD h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng, h\u1ED7 tr\u1EE3 gi\u1EA3i quy\u1EBFt quy\u1EC1n l\u1EE3i b\u1EA3o hi\u1EC3m x\xE3 h\u1ED9i / P&I",
          "K\u1EBFt n\u1ED1i gi\u1EDBi thi\u1EC7u vi\u1EC7c l\xE0m m\u1EDBi trong n\u01B0\u1EDBc ho\u1EB7c ti\u1EBFp t\u1EE5c k\xFD h\u1EE3p \u0111\u1ED3ng \u0111i bi\u1EC3n chuy\u1EBFn m\u1EDBi",
          "K\xEAnh ti\u1EBFp nh\u1EADn v\xE0 x\u1EED l\xFD ph\u1EA3n \xE1nh, khi\u1EBFu n\u1EA1i c\u1EE7a ng\u01B0\u1EDDi lao \u0111\u1ED9ng 24/7"
        ]
      },
      {
        name: "Ph\xF2ng An to\xE0n v\u1EC7 sinh lao \u0111\u1ED9ng",
        en: "Occupational Health and Safety (OHS) Department",
        desc: "X\xE2y d\u1EF1ng, gi\xE1m s\xE1t v\xE0 ki\u1EC3m tra quy chu\u1EA9n an to\xE0n, v\u1EC7 sinh lao \u0111\u1ED9ng v\xE0 s\u1EE9c kho\u1EBB ngh\u1EC1 nghi\u1EC7p cho ng\u01B0\u1EDDi lao \u0111\u1ED9ng tr\xEAn t\xE0u v\xE0 t\u1EA1i n\u01B0\u1EDBc ngo\xE0i.",
        pts: [
          "\u0110\xE1nh gi\xE1 r\u1EE7i ro an to\xE0n v\xE0 t\u1ED5 ch\u1EE9c hu\u1EA5n luy\u1EC7n an to\xE0n \u0111\u1ECBnh k\u1EF3 OHS",
          "\u0110i\u1EC1u tra, l\u1EADp b\xE1o c\xE1o v\xE0 x\u1EED l\xFD k\u1ECBp th\u1EDDi c\xE1c s\u1EF1 c\u1ED1 ph\xE1t sinh",
          "Theo d\xF5i s\u1EE9c kho\u1EBB \u0111\u1ECBnh k\u1EF3 v\xE0 ki\u1EC3m tra \u0111i\u1EC1u ki\u1EC7n sinh ho\u1EA1t c\u1EE7a thuy\u1EC1n vi\xEAn"
        ]
      }
    ],
    steps: [
      { title: "Ti\u1EBFp nh\u1EADn th\xF4ng tin", desc: "Qua hotline 24/7, email ho\u1EB7c bi\u1EC3u m\u1EABu tr\u1EF1c tuy\u1EBFn" },
      { title: "\u0110\xE1nh gi\xE1 nhu c\u1EA7u", desc: "Ki\u1EC3m tra quy\u1EC1n l\u1EE3i h\u1EE3p \u0111\u1ED3ng, t\xECnh tr\u1EA1ng s\u1EE9c kh\u1ECFe" },
      { title: "H\u1ED7 tr\u1EE3 th\u1EE7 t\u1EE5c", desc: "Thanh to\xE1n ch\u1EBF \u0111\u1ED9, gi\u1EA3i quy\u1EBFt th\u1EE7 t\u1EE5c b\u1EA3o hi\u1EC3m" },
      { title: "T\xE1i h\xF2a nh\u1EADp & Vi\u1EC7c l\xE0m", desc: "K\u1EBFt n\u1ED1i vi\u1EC7c l\xE0m m\u1EDBi ho\u1EB7c b\u1ED1 tr\xED chuy\u1EBFn t\xE0u k\u1EBF ti\u1EBFp", isPartner: true },
      { title: "Theo d\xF5i & L\u01B0u tr\u1EEF", desc: "L\u01B0u tr\u1EEF h\u1ED3 s\u01A1 b\u1EA3o m\u1EADt v\xE0 theo d\xF5i \u0111\u1ECBnh k\u1EF3" }
    ],
    related: [
      { divId: "k01", unitIndex: 0 },
      { divId: "k03", unitIndex: 0 },
      { divId: "k02", unitIndex: 0 }
    ]
  }
];
var JOB_POSITIONS = [
  {
    id: "JOB-M01",
    title: "Thuy\u1EC1n tr\u01B0\u1EDFng (Master) \u2013 T\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m qu\u1ED1c t\u1EBF",
    divisionId: "k01",
    category: "Thuy\u1EC1n vi\xEAn",
    destination: "Tuy\u1EBFn qu\u1ED1c t\u1EBF / Ch\xE2u \xC1",
    shipTypeOrIndustry: "T\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m (Oil Tanker 13,000 - 20,000 DWT)",
    salaryRange: "$5,500 \u2013 $6,800 / th\xE1ng",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 6 th\xE1ng (\xB11 th\xE1ng)",
    deadline: "25/11/2026",
    quota: 2,
    requirements: [
      "C\xF3 B\u1EB1ng Thuy\u1EC1n tr\u01B0\u1EDFng h\u1EA1ng 1 (STCW II/2) c\xF2n h\u1EA1n t\u1ED1i thi\u1EC3u 18 th\xE1ng",
      "Kinh nghi\u1EC7m \xEDt nh\u1EA5t 18 th\xE1ng l\xE0m Thuy\u1EC1n tr\u01B0\u1EDFng tr\xEAn t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t t\u01B0\u01A1ng \u0111\u01B0\u01A1ng",
      "Ti\u1EBFng Anh h\xE0ng h\u1EA3i l\u01B0u lo\xE1t, th\xE0nh th\u1EA1o giao ti\u1EBFp PSC, Vetting, SIRE inspection",
      "\u0110\u1EA7y \u0111\u1EE7 c\xE1c ch\u1EE9ng ch\u1EC9 n\xE2ng cao: Ch\u1EEFa ch\xE1y n\xE2ng cao, S\u01A1 c\u1EE9u y t\u1EBF, BRM"
    ],
    benefits: [
      "Thu nh\u1EADp c\u1EA1nh tranh chi tr\u1EA3 b\u1EB1ng ngo\u1EA1i t\u1EC7 (USD) chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng",
      "B\u1EA3o hi\u1EC3m P&I qu\u1ED1c t\u1EBF to\xE0n di\u1EC7n, b\u1EA3o hi\u1EC3m tai n\u1EA1n v\xE0 y t\u1EBF su\u1ED1t th\u1EDDi gian h\u1EE3p \u0111\u1ED3ng",
      "V\xE9 m\xE1y bay kh\u1EE9 h\u1ED3i, kh\xE1ch s\u1EA1n \u0111\xF3n t\xE0u v\xE0 chi ph\xED xu\u1EA5t c\u1EA3nh do c\xF4ng ty chi tr\u1EA3 100%",
      "Ch\u1EBF \u0111\u1ED9 ngh\u1EC9 ph\xE9p v\xE0 \u01B0u ti\xEAn k\xFD ti\u1EBFp h\u1EE3p \u0111\u1ED3ng sau chuy\u1EBFn ngh\u1EC9"
    ],
    featured: true
  },
  {
    id: "JOB-M02",
    title: "M\xE1y tr\u01B0\u1EDFng (Chief Engineer) \u2013 T\xE0u ch\u1EDF h\xE0ng r\u1EDDi & d\u1EA7u",
    divisionId: "k01",
    category: "Thuy\u1EC1n vi\xEAn",
    destination: "Tuy\u1EBFn \u0110\xF4ng Nam \xC1 - Vi\u1EC5n \u0110\xF4ng",
    shipTypeOrIndustry: "T\xE0u ch\u1EDF d\u1EA7u & h\xE0ng r\u1EDDi (Bulk Carrier / Tanker)",
    salaryRange: "$5,200 \u2013 $6,500 / th\xE1ng",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 6 th\xE1ng",
    deadline: "30/11/2026",
    quota: 3,
    requirements: [
      "B\u1EB1ng M\xE1y tr\u01B0\u1EDFng h\u1EA1ng 1 (STCW III/2)",
      "Kinh nghi\u1EC7m t\u1ED1i thi\u1EC3u 12 th\xE1ng \u0111\u1EA3m nhi\u1EC7m ch\u1EE9c danh M\xE1y tr\u01B0\u1EDFng m\xE1y ch\xEDnh MAN B&W/Sulzer",
      "Qu\u1EA3n l\xFD t\u1ED1t h\u1EC7 th\u1ED1ng b\u1EA3o d\u01B0\u1EE1ng d\u1EF1 ph\xF2ng PMS, nh\u1EADt k\xFD m\xE1y v\xE0 ph\u1EE5 t\xF9ng d\u1EF1 tr\u1EEF",
      "S\u1EE9c kh\u1ECFe \u0111\u1EA1t ti\xEAu chu\u1EA9n thuy\u1EC1n vi\xEAn vi\u1EC5n d\u01B0\u01A1ng, kh\xF4ng m\u1EAFc b\u1EC7nh m\xE3n t\xEDnh"
    ],
    benefits: [
      "L\u01B0\u01A1ng th\u01B0\u1EDFng \u0111\xFAng h\u1EA1n, ph\u1EE5 c\u1EA5p th\xE2m ni\xEAn v\xE0 tr\xE1ch nhi\u1EC7m",
      "B\u1EA3o hi\u1EC3m thuy\u1EC1n vi\xEAn theo chu\u1EA9n MLC 2006",
      "\u0110\xE0i th\u1ECD to\xE0n b\u1ED9 chi ph\xED sinh ho\u1EA1t, \u0103n \u1EDF \u0111\u1EA1t ti\xEAu chu\u1EA9n tr\xEAn t\xE0u"
    ],
    featured: true
  },
  {
    id: "JOB-M03",
    title: "Th\u1EE7y th\u1EE7 AB (Able Seaman) \u2013 \u0110\u1ED9i t\xE0u \xC2u L\u1EA1c",
    divisionId: "k01",
    category: "Thuy\u1EC1n vi\xEAn",
    destination: "Tuy\u1EBFn n\u1ED9i \u0111\u1ECBa & \u0110\xF4ng Nam \xC1",
    shipTypeOrIndustry: "\u0110\u1ED9i t\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m Aulac Vision / Vanguard",
    salaryRange: "26.000.000 \u2013 32.000.000 VN\u0110 / th\xE1ng",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 8\u20139 th\xE1ng",
    deadline: "15/11/2026",
    quota: 8,
    requirements: [
      "Ch\u1EE9ng ch\u1EC9 kh\u1EA3 n\u0103ng chuy\xEAn m\xF4n Th\u1EE7y th\u1EE7 tr\u1EF1c ca (STCW II/4 ho\u1EB7c II/5)",
      "C\xF3 ch\u1EE9ng ch\u1EC9 an to\xE0n c\u01A1 b\u1EA3n STCW, hu\u1EA5n luy\u1EC7n t\xE0u d\u1EA7u c\u01A1 b\u1EA3n",
      "Kinh nghi\u1EC7m \u0111i bi\u1EC3n t\u1ED1i thi\u1EC3u 6 th\xE1ng tr\xEAn t\xE0u bi\u1EC3n",
      "K\u1EF7 lu\u1EADt t\u1ED1t, t\xE1c phong nhanh nh\u1EB9n, ch\u1EA5p h\xE0nh an to\xE0n lao \u0111\u1ED9ng nghi\xEAm ng\u1EB7t"
    ],
    benefits: [
      "L\u01B0\u01A1ng c\u1EE9ng + ph\u1EE5 c\u1EA5p l\xE0m h\xE0ng, b\u1EA3o h\u1ED9 lao \u0111\u1ED9ng trang c\u1EA5p \u0111\u1EA7y \u0111\u1EE7",
      "\u0110\u01B0\u1EE3c \u0111\xF3ng BHXH, BHYT, BHTN theo lu\u1EADt lao \u0111\u1ED9ng Vi\u1EC7t Nam",
      "C\u01A1 h\u1ED9i h\u1ECDc t\u1EADp b\u1ED3i d\u01B0\u1EE1ng l\xEAn ch\u1EE9c danh S\u0129 quan boong (OOW)"
    ]
  },
  {
    id: "JOB-M04",
    title: "Th\u1EE3 m\xE1y Oiler / Motorman \u2013 T\xE0u bi\u1EC3n vi\u1EC5n d\u01B0\u01A1ng",
    divisionId: "k01",
    category: "Thuy\u1EC1n vi\xEAn",
    destination: "Tuy\u1EBFn Ch\xE2u \xC1 - Th\xE1i B\xECnh D\u01B0\u01A1ng",
    shipTypeOrIndustry: "T\xE0u h\xF3a ch\u1EA5t & d\u1EA7u s\u1EA3n ph\u1EA9m",
    salaryRange: "$1,100 \u2013 $1,400 / th\xE1ng",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 9 th\xE1ng",
    deadline: "20/11/2026",
    quota: 6,
    requirements: [
      "Ch\u1EE9ng ch\u1EC9 Th\u1EE3 m\xE1y tr\u1EF1c ca (STCW III/4 ho\u1EB7c III/5)",
      "Kinh nghi\u1EC7m tr\u1EF1c ca bu\u1ED3ng m\xE1y, b\u1EA3o d\u01B0\u1EE1ng b\u01A1m, van, m\xE1y ph\xE2n ly",
      "S\u1EE9c kho\u1EBB t\u1ED1t, ch\u1ECBu \u0111\u01B0\u1EE3c m\xF4i tr\u01B0\u1EDDng nhi\u1EC7t \u0111\u1ED9 cao trong bu\u1ED3ng m\xE1y"
    ],
    benefits: [
      "L\u01B0\u01A1ng USD, ph\u1EE5 c\u1EA5p l\xE0m th\xEAm gi\u1EDD v\xE0 ph\u1EE5 c\u1EA5p v\u1EC7 sinh k\xE9t",
      "B\u1EA3o hi\u1EC3m th\xE2n th\u1EC3 v\xE0 tai n\u1EA1n P&I",
      "H\u1ED7 tr\u1EE3 \u0111\xE0o t\u1EA1o n\xE2ng h\u1EA1ng ch\u1EE9ng ch\u1EC9 chuy\xEAn m\xF4n"
    ]
  },
  {
    id: "JOB-L01",
    title: "K\u1EF9 s\u01B0 C\u01A1 kh\xED & T\u1EF1 \u0111\u1ED9ng ho\xE1 \u2013 L\xE0m vi\u1EC7c t\u1EA1i Nh\u1EADt B\u1EA3n",
    divisionId: "k03",
    category: "K\u1EF9 s\u01B0 k\u1EF9 thu\u1EADt",
    destination: "Nagoya, Osaka (Nh\u1EADt B\u1EA3n)",
    shipTypeOrIndustry: "Nh\xE0 m\xE1y ch\u1EBF t\u1EA1o c\u01A1 kh\xED ch\xEDnh x\xE1c & thi\u1EBFt b\u1ECB t\u1EF1 \u0111\u1ED9ng ho\xE1",
    salaryRange: "42.000.000 \u2013 58.000.000 VN\u0110 / th\xE1ng (230,000 - 320,000 Y\xEAn)",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 3 n\u0103m (gia h\u1EA1n v\u0129nh tr\xFA)",
    deadline: "10/12/2026",
    quota: 10,
    requirements: [
      "T\u1ED1t nghi\u1EC7p \u0110\u1EA1i h\u1ECDc / Cao \u0111\u1EB3ng chuy\xEAn ng\xE0nh C\u01A1 kh\xED, C\u01A1 \u0111i\u1EC7n t\u1EED, T\u1EF1 \u0111\u1ED9ng h\xF3a",
      "Ti\u1EBFng Nh\u1EADt t\u01B0\u01A1ng \u0111\u01B0\u01A1ng N4 tr\u1EDF l\xEAn (\u1EE9ng vi\xEAn ch\u01B0a c\xF3 ti\u1EBFng \u0111\u01B0\u1EE3c \u0111\xE0o t\u1EA1o t\u1EA1i Kh\u1ED1i 02)",
      "\u01AFu ti\xEAn bi\u1EBFt \u0111\u1ECDc b\u1EA3n v\u1EBD k\u1EF9 thu\u1EADt CAD, v\u1EADn h\xE0nh m\xE1y phay CNC, m\xE1y ti\u1EC7n",
      "\u0110\u1ED9 tu\u1ED5i 22\u201335, s\u1EE9c kho\u1EBB t\u1ED1t, kh\xF4ng c\xF3 ti\u1EC1n \xE1n ti\u1EC1n s\u1EF1"
    ],
    benefits: [
      "Visa K\u1EF9 s\u01B0 (ch\u1EBF \u0111\u1ED9 ph\xFAc l\u1EE3i nh\u01B0 c\xF4ng d\xE2n Nh\u1EADt B\u1EA3n, b\u1EA3o l\xE3nh v\u1EE3 con sang c\xF9ng)",
      "H\u1ED7 tr\u1EE3 k\xFD t\xFAc x\xE1, tr\u1EE3 c\u1EA5p \u0111i l\u1EA1i, \u0111\xF3ng b\u1EA3o hi\u1EC3m \u0111\u1EA7y \u0111\u1EE7 (Nenkin, b\u1EA3o hi\u1EC3m y t\u1EBF)",
      "Th\u01B0\u1EDFng 2 l\u1EA7n/n\u0103m (t\u01B0\u01A1ng \u0111\u01B0\u01A1ng 2\u20133 th\xE1ng l\u01B0\u01A1ng), t\u0103ng l\u01B0\u01A1ng h\u1EB1ng n\u0103m theo n\u0103ng l\u1EF1c"
    ],
    featured: true
  },
  {
    id: "JOB-L02",
    title: "\u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn & Ch\u0103m s\xF3c ng\u01B0\u1EDDi cao tu\u1ED5i \u2013 CHLB \u0110\u1EE9c",
    divisionId: "k03",
    category: "\u0110i\u1EC1u d\u01B0\u1EE1ng y t\u1EBF",
    destination: "Frankfurt & Berlin (CHLB \u0110\u1EE9c)",
    shipTypeOrIndustry: "H\u1EC7 th\u1ED1ng b\u1EC7nh vi\u1EC7n v\xE0 vi\u1EC7n d\u01B0\u1EE1ng l\xE3o c\xF4ng l\u1EADp",
    salaryRange: "65.000.000 \u2013 85.000.000 VN\u0110 / th\xE1ng (2,800 - 3,400 Euro)",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng d\xE0i h\u1EA1n kh\xF4ng th\u1EDDi h\u1EA1n sau 2 n\u0103m",
    deadline: "28/11/2026",
    quota: 15,
    requirements: [
      "T\u1ED1t nghi\u1EC7p Cao \u0111\u1EB3ng ho\u1EB7c \u0110\u1EA1i h\u1ECDc \u0110i\u1EC1u d\u01B0\u1EE1ng t\u1EA1i Vi\u1EC7t Nam",
      "Tr\xECnh \u0111\u1ED9 ti\u1EBFng \u0110\u1EE9c B1 (\u0111\u01B0\u1EE3c c\xF4ng ty \u0111\xE0o t\u1EA1o l\xEAn B2 tr\u01B0\u1EDBc khi \u0111i l\xE0m ch\xEDnh th\u1EE9c)",
      "T\xEDnh c\xE1ch ki\xEAn nh\u1EABn, trung th\u1EF1c, y\xEAu th\xEDch c\xF4ng vi\u1EC7c ch\u0103m s\xF3c y t\u1EBF",
      "L\xFD l\u1ECBch t\u01B0 ph\xE1p trong s\u1EA1ch, s\u1EE9c kho\u1EBB \u0111\xE1p \u1EE9ng quy \u0111\u1ECBnh sang \u0110\u1EE9c l\xE0m vi\u1EC7c"
    ],
    benefits: [
      "\u0110\u01B0\u1EE3c h\u1ECDc b\u1ED5ng \u0111\xE0i th\u1ECD h\u1ECDc ph\xED ti\u1EBFng \u0110\u1EE9c v\xE0 chi ph\xED xin visa",
      "M\u1EE9c l\u01B0\u01A1ng kh\u1EDFi \u0111i\u1EC3m cao theo b\u1EA3ng l\u01B0\u01A1ng c\xF4ng ch\u1EE9c y t\u1EBF CHLB \u0110\u1EE9c",
      "C\u01A1 h\u1ED9i \u0111\u1ECBnh c\u01B0 v\u0129nh vi\u1EC5n v\xE0 qu\u1ED1c t\u1ECBch \u0110\u1EE9c sau 3\u20135 n\u0103m l\xE0m vi\u1EC7c li\xEAn t\u1EE5c"
    ],
    featured: true
  },
  {
    id: "JOB-L03",
    title: "K\u1EF9 thu\u1EADt vi\xEAn H\xE0n c\xF4ng ngh\u1EC7 cao (TIG/MIG) \u2013 H\xE0n Qu\u1ED1c (Visa E-7)",
    divisionId: "k03",
    category: "K\u1EF9 s\u01B0 k\u1EF9 thu\u1EADt",
    destination: "Ulsan, Busan (H\xE0n Qu\u1ED1c)",
    shipTypeOrIndustry: "X\u01B0\u1EDFng \u0111\xF3ng t\xE0u hi\u1EC7n \u0111\u1EA1i Huyndai / Hanwha Ocean",
    salaryRange: "48.000.000 \u2013 62.000.000 VN\u0110 / th\xE1ng (2,600,000 - 3,300,000 Won)",
    contractDuration: "H\u1EE3p \u0111\u1ED3ng 2 n\u0103m (gia h\u1EA1n theo d\u1EF1 \xE1n)",
    deadline: "05/12/2026",
    quota: 12,
    requirements: [
      "Tay ngh\u1EC1 h\xE0n 3G/4G/6G, c\xF3 ch\u1EE9ng ch\u1EC9 h\xE0n qu\u1ED1c t\u1EBF l\xE0 l\u1EE3i th\u1EBF",
      "Kinh nghi\u1EC7m \xEDt nh\u1EA5t 2 n\u0103m l\xE0m vi\u1EC7c t\u1EA1i x\u01B0\u1EDFng \u0111\xF3ng t\xE0u ho\u1EB7c k\u1EBFt c\u1EA5u th\xE9p",
      "V\u01B0\u1EE3t qua b\xE0i test tay ngh\u1EC1 th\u1EF1c t\u1EBF do \u0111\u1EA1i di\u1EC7n ch\u1EE7 t\xE0u/nh\xE0 m\xE1y H\xE0n Qu\u1ED1c ki\u1EC3m tra"
    ],
    benefits: [
      "Visa chuy\xEAn gia E-7, h\u1EE3p ph\xE1p v\xE0 b\u1EA3o h\u1ED9 quy\u1EC1n l\u1EE3i cao nh\u1EA5t",
      "Doanh nghi\u1EC7p h\u1ED7 tr\u1EE3 ti\u1EC1n nh\xE0 \u1EDF, ph\u1EE5 c\u1EA5p b\u1EEFa \u0103n v\xE0 b\u1EA3o hi\u1EC3m lao \u0111\u1ED9ng",
      "L\xE0m th\xEAm gi\u1EDD t\xEDnh 150% theo Lu\u1EADt Ti\xEAu chu\u1EA9n Lao \u0111\u1ED9ng H\xE0n Qu\u1ED1c"
    ]
  },
  {
    id: "JOB-E01",
    title: "Gi\u1EA3ng vi\xEAn Ti\u1EBFng Anh H\xE0ng h\u1EA3i (Maritime English) \u2013 TT \xC2u L\u1EA1c",
    divisionId: "k02",
    category: "V\u0103n ph\xF2ng",
    destination: "TP. H\u1ED3 Ch\xED Minh",
    shipTypeOrIndustry: "Trung t\xE2m \u0110\xE0o t\u1EA1o Ngo\u1EA1i ng\u1EEF & Tin h\u1ECDc \xC2u L\u1EA1c (Kh\u1ED1i 02)",
    salaryRange: "18.000.000 \u2013 25.000.000 VN\u0110 / th\xE1ng",
    contractDuration: "To\xE0n th\u1EDDi gian l\xE2u d\xE0i",
    deadline: "15/12/2026",
    quota: 2,
    requirements: [
      "T\u1ED1t nghi\u1EC7p \u0110\u1EA1i h\u1ECDc Ngo\u1EA1i ng\u1EEF ho\u1EB7c \u0110\u1EA1i h\u1ECDc H\xE0ng h\u1EA3i chuy\xEAn ng\xE0nh Ti\u1EBFng Anh",
      "C\xF3 ch\u1EE9ng ch\u1EC9 IELTS 7.0+ ho\u1EB7c TOEIC 850+, hi\u1EC3u bi\u1EBFt thu\u1EADt ng\u1EEF SMCP (IMO Standard Marine Communication Phrases)",
      "K\u1EF9 n\u0103ng s\u01B0 ph\u1EA1m t\u1ED1t, nhi\u1EC7t huy\u1EBFt v\u1EDBi vi\u1EC7c \u0111\xE0o t\u1EA1o thuy\u1EC1n vi\xEAn Vi\u1EC7t Nam h\u1ED9i nh\u1EADp"
    ],
    benefits: [
      "M\xF4i tr\u01B0\u1EDDng l\xE0m vi\u1EC7c n\u0103ng \u0111\u1ED9ng, ti\u1EBFp x\xFAc v\u1EDBi c\xE1c chuy\xEAn gia h\xE0ng h\u1EA3i qu\u1ED1c t\u1EBF",
      "\u0110\u1EA7y \u0111\u1EE7 ch\u1EBF \u0111\u1ED9 b\u1EA3o hi\u1EC3m, ngh\u1EC9 ph\xE9p n\u0103m, l\u01B0\u01A1ng th\xE1ng 13 v\xE0 th\u01B0\u1EDFng d\u1EF1 \xE1n"
    ]
  },
  {
    id: "JOB-S01",
    title: "Du h\u1ECDc sinh ngh\u1EC1 Nh\xE0 h\xE0ng - Kh\xE1ch s\u1EA1n c\xF3 l\u01B0\u01A1ng \u2013 CHLB \u0110\u1EE9c",
    divisionId: "k04",
    category: "Du h\u1ECDc ngh\u1EC1",
    destination: "Munich, Hamburg (CHLB \u0110\u1EE9c)",
    shipTypeOrIndustry: "T\u1EADp \u0111o\xE0n kh\xE1ch s\u1EA1n qu\u1ED1c t\u1EBF t\u1EA1i \u0110\u1EE9c",
    salaryRange: "28.000.000 \u2013 35.000.000 VN\u0110 / th\xE1ng (1,100 - 1,400 Euro tr\u1EE3 c\u1EA5p h\u1ECDc ngh\u1EC1)",
    contractDuration: "Ch\u01B0\u01A1ng tr\xECnh h\u1ECDc ngh\u1EC1 3 n\u0103m + L\xE0m vi\u1EC7c 5 n\u0103m",
    deadline: "20/12/2026",
    quota: 20,
    requirements: [
      "T\u1ED1t nghi\u1EC7p THPT tr\u1EDF l\xEAn, \u0111\u1ED9 tu\u1ED5i 18\u201328",
      "H\u1ECDc ti\u1EBFng \u0110\u1EE9c \u0111\u1EA1t ch\u1EE9ng ch\u1EC9 B1 t\u1EA1i Vi\u1EC7t Nam",
      "Nhanh nh\u1EB9n, ch\u0103m ch\u1EC9, kh\xF4ng m\u1EAFc c\xE1c b\u1EC7nh truy\u1EC1n nhi\u1EC5m"
    ],
    benefits: [
      "Mi\u1EC5n 100% h\u1ECDc ph\xED su\u1ED1t 3 n\u0103m \u0111\xE0o t\u1EA1o t\u1EA1i tr\u01B0\u1EDDng ngh\u1EC1 \u0110\u1EE9c",
      "Nh\u1EADn l\u01B0\u01A1ng th\u1EF1c t\u1EADp h\xE0ng th\xE1ng \u0111\u1EE7 chi tr\u1EA3 sinh ho\u1EA1t ph\xED",
      "C\xF3 vi\u1EC7c l\xE0m ngay sau khi t\u1ED1t nghi\u1EC7p v\u1EDBi m\u1EE9c l\u01B0\u01A1ng t\u1EEB 2,800 Euro/th\xE1ng"
    ]
  }
];
var FLEET_VESSELS = [
  {
    id: "V01",
    name: "Aulac Vision",
    type: "Oil Products Tanker",
    dwt: "13,109 DWT",
    builtYear: 2010,
    flag: "Vi\u1EC7t Nam (VR)",
    tradingArea: "\u0110\xF4ng Nam \xC1, Vi\u1EC5n \u0110\xF4ng",
    crewComplement: "21 Thuy\u1EC1n vi\xEAn"
  },
  {
    id: "V02",
    name: "Aulac Vanguard",
    type: "Oil Products / Chemical Tanker",
    dwt: "19,998 DWT",
    builtYear: 2016,
    flag: "Panama",
    tradingArea: "Qu\u1ED1c t\u1EBF to\xE0n c\u1EA7u",
    crewComplement: "23 Thuy\u1EC1n vi\xEAn"
  },
  {
    id: "V03",
    name: "Aulac Diamond",
    type: "Oil Products Tanker",
    dwt: "11,280 DWT",
    builtYear: 2012,
    flag: "Vi\u1EC7t Nam",
    tradingArea: "V\xF9ng bi\u1EC3n n\u1ED9i \u0111\u1ECBa & Khu v\u1EF1c",
    crewComplement: "20 Thuy\u1EC1n vi\xEAn"
  },
  {
    id: "V04",
    name: "Aulac Conifer",
    type: "Chemical & Oil Tanker",
    dwt: "13,500 DWT",
    builtYear: 2014,
    flag: "Panama",
    tradingArea: "\u0110\xF4ng Nam \xC1, Trung Qu\u1ED1c, Nh\u1EADt B\u1EA3n",
    crewComplement: "22 Thuy\u1EC1n vi\xEAn"
  },
  {
    id: "V05",
    name: "Aulac Aurora",
    type: "Product Tanker",
    dwt: "19,850 DWT",
    builtYear: 2018,
    flag: "Vi\u1EC7t Nam",
    tradingArea: "Ch\xE2u \xC1 - Trung \u0110\xF4ng",
    crewComplement: "23 Thuy\u1EC1n vi\xEAn"
  },
  {
    id: "V06",
    name: "Aulac Bella",
    type: "Oil Tanker",
    dwt: "6,500 DWT",
    builtYear: 2015,
    flag: "Vi\u1EC7t Nam",
    tradingArea: "Tuy\u1EBFn b\u1EDD bi\u1EC3n Vi\u1EC7t Nam & V\u1ECBnh Th\xE1i Lan",
    crewComplement: "18 Thuy\u1EC1n vi\xEAn"
  }
];
var NEWS_ARTICLES = [
  {
    id: "NEWS-01",
    category: "\u0110\xE0o t\u1EA1o h\xE0ng h\u1EA3i",
    title: "Khai gi\u1EA3ng kho\xE1 b\u1ED3i d\u01B0\u1EE1ng Hu\u1EA5n luy\u1EC7n An to\xE0n c\u01A1 b\u1EA3n STCW v\xE0 Ti\u1EBFng Anh H\xE0ng h\u1EA3i th\xE1ng 11/2026",
    summary: "Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c (Kh\u1ED1i 02) ch\xEDnh th\u1EE9c m\u1EDF \u0111\u0103ng k\xFD kho\xE1 h\u1ECDc c\u1EADp nh\u1EADt cho thuy\u1EC1n vi\xEAn m\u1EDBi v\xE0 s\u0129 quan chu\u1EA9n b\u1ECB nh\u1EADn t\xE0u.",
    date: "06/10/2026",
    readTime: "4 ph\xFAt \u0111\u1ECDc",
    coverImage: "/src/assets/images/training_simulator_bridge_1791512952544.jpg",
    body: "Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c (Kh\u1ED1i 02) m\u1EDF \u0111\u0103ng k\xFD kh\xF3a b\u1ED3i d\u01B0\u1EE1ng trong th\xE1ng 11/2026 d\xE0nh cho thuy\u1EC1n vi\xEAn m\u1EDBi v\xE0 s\u0129 quan \u0111ang chu\u1EA9n b\u1ECB nh\u1EADn t\xE0u.\n\nN\u1ED9i dung theo b\xE0i vi\u1EBFt g\u1ED3m Hu\u1EA5n luy\u1EC7n An to\xE0n c\u01A1 b\u1EA3n STCW v\xE0 Ti\u1EBFng Anh H\xE0ng h\u1EA3i. \u1EE8ng vi\xEAn c\xF3 th\u1EC3 li\xEAn h\u1EC7 ALCM \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u01B0\u1EDBng d\u1EABn h\u1ED3 s\u01A1 v\xE0 l\u1ECBch h\u1ECDc ph\xF9 h\u1EE3p."
  },
  {
    id: "NEWS-02",
    category: "Cung \u1EE9ng thuy\u1EC1n vi\xEAn",
    title: "ALCM ho\xE0n t\u1EA5t cung \u1EE9ng to\xE0n b\u1ED9 thuy\u1EC1n b\u1ED9 22 s\u0129 quan & thuy\u1EC1n vi\xEAn cho t\xE0u d\u1EA7u \u0111\u1ED1i t\xE1c Singapore",
    summary: "\u0110\u1ED9i ng\u0169 thuy\u1EC1n vi\xEAn ALCM v\u01B0\u1EE3t qua c\xE1c v\xF2ng ki\u1EC3m tra vetting nghi\xEAm ng\u1EB7t v\xE0 \u0111\xE3 \u0111\xF3n t\xE0u an to\xE0n t\u1EA1i c\u1EA3ng Jurong, Singapore.",
    date: "02/10/2026",
    readTime: "3 ph\xFAt \u0111\u1ECDc",
    coverImage: "/src/assets/images/vessel_aulac_tanker_1791511383610.jpg",
    body: "ALCM ho\xE0n t\u1EA5t cung \u1EE9ng \u0111\u1ED9i ng\u0169 g\u1ED3m 22 s\u0129 quan v\xE0 thuy\u1EC1n vi\xEAn cho t\xE0u d\u1EA7u c\u1EE7a \u0111\u1ED1i t\xE1c Singapore.\n\nTheo th\xF4ng tin b\xE0i vi\u1EBFt, \u0111\u1ED9i ng\u0169 \u0111\xE3 v\u01B0\u1EE3t qua c\xE1c v\xF2ng ki\u1EC3m tra vetting v\xE0 \u0111\xF3n t\xE0u an to\xE0n t\u1EA1i c\u1EA3ng Jurong, Singapore."
  },
  {
    id: "NEWS-03",
    category: "Ch\xEDnh s\xE1ch & Ph\xE1p l\xFD",
    title: "C\u1EADp nh\u1EADt c\xE1c quy chu\u1EA9n m\u1EDBi c\u1EE7a C\xF4ng \u01B0\u1EDBc Lao \u0111\u1ED9ng H\xE0ng h\u1EA3i MLC 2006 v\xE0 b\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i thuy\u1EC1n vi\xEAn",
    summary: "Ph\xF2ng T\u01B0 v\u1EA5n ph\xE1p ch\u1EBF an to\xE0n t\xE0u (Kh\u1ED1i 01) t\u1ED5ng h\u1EE3p c\xE1c \u0111i\u1EC3m s\u1EEDa \u0111\u1ED5i b\u1ED5 sung v\u1EC1 an to\xE0n v\u1EC7 sinh lao \u0111\u1ED9ng v\xE0 li\xEAn l\u1EA1c tr\xEAn bi\u1EC3n.",
    date: "28/09/2026",
    readTime: "5 ph\xFAt \u0111\u1ECDc",
    coverImage: "/src/assets/images/crew_training_safety_1791511397644.jpg",
    body: "Ph\xF2ng T\u01B0 v\u1EA5n ph\xE1p ch\u1EBF an to\xE0n t\xE0u (Kh\u1ED1i 01) t\u1ED5ng h\u1EE3p c\xE1c \u0111i\u1EC3m c\u1EA7n l\u01B0u \xFD trong quy chu\u1EA9n C\xF4ng \u01B0\u1EDBc Lao \u0111\u1ED9ng H\xE0ng h\u1EA3i MLC 2006.\n\nB\xE0i vi\u1EBFt t\u1EADp trung v\xE0o c\xE1c n\u1ED9i dung s\u1EEDa \u0111\u1ED5i v\u1EC1 an to\xE0n, v\u1EC7 sinh lao \u0111\u1ED9ng v\xE0 li\xEAn l\u1EA1c tr\xEAn bi\u1EC3n, h\u01B0\u1EDBng t\u1EDBi vi\u1EC7c gi\xFAp thuy\u1EC1n vi\xEAn n\u1EAFm r\xF5 quy\u1EC1n l\u1EE3i v\xE0 y\xEAu c\u1EA7u khi l\xE0m vi\u1EC7c."
  },
  {
    id: "NEWS-04",
    category: "Xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng",
    title: "Nghi\u1EC7p \u0111o\xE0n Nh\u1EADt B\u1EA3n ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp 30 ch\u1EC9 ti\xEAu K\u1EF9 s\u01B0 C\u01A1 kh\xED v\xE0 T\u1EF1 \u0111\u1ED9ng ho\xE1 t\u1EA1i tr\u1EE5 s\u1EDF ALCM",
    summary: "C\xE1c \u1EE9ng vi\xEAn tr\xFAng tuy\u1EC3n s\u1EBD \u0111\u01B0\u1EE3c \u0111\xE0o t\u1EA1o ti\u1EBFng Nh\u1EADt N3 v\xE0 gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng mi\u1EC5n ph\xED tr\u01B0\u1EDBc khi sang l\xE0m vi\u1EC7c t\u1EA1i v\xF9ng Kanto.",
    date: "22/09/2026",
    readTime: "4 ph\xFAt \u0111\u1ECDc",
    coverImage: "/src/assets/images/japan_precision_engineers_1791512966858.jpg",
    body: "Nghi\u1EC7p \u0111o\xE0n Nh\u1EADt B\u1EA3n t\u1ED5 ch\u1EE9c ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp 30 ch\u1EC9 ti\xEAu k\u1EF9 s\u01B0 c\u01A1 kh\xED v\xE0 t\u1EF1 \u0111\u1ED9ng h\xF3a t\u1EA1i tr\u1EE5 s\u1EDF ALCM.\n\n\u1EE8ng vi\xEAn tr\xFAng tuy\u1EC3n s\u1EBD \u0111\u01B0\u1EE3c \u0111\xE0o t\u1EA1o ti\u1EBFng Nh\u1EADt N3 v\xE0 tham gia ch\u01B0\u01A1ng tr\xECnh gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng mi\u1EC5n ph\xED tr\u01B0\u1EDBc khi sang l\xE0m vi\u1EC7c t\u1EA1i v\xF9ng Kanto."
  }
];
var UPCOMING_EVENTS = [
  {
    id: "EVT-01",
    title: "Ph\u1ECFng v\u1EA5n Tr\u1EF1c ti\u1EBFp S\u0129 quan & Thuy\u1EC1n vi\xEAn T\xE0u D\u1EA7u c\xF9ng Ch\u1EE7 t\xE0u Nh\u1EADt B\u1EA3n",
    type: "interview_crew",
    typeLabel: "Ph\u1ECFng v\u1EA5n Thuy\u1EC1n vi\xEAn",
    date: "18/10/2026",
    dateIso: "2026-10-18",
    time: "08:30 - 16:30",
    dayOfWeek: "Ch\u1EE7 Nh\u1EADt",
    locationType: "hybrid",
    locationAddress: "T\xF2a nh\xE0 Saigon View Office, 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh, TP.HCM",
    roomOrPlatform: "Ph\xF2ng H\u1ED9i ngh\u1ECB VIP T\u1EA7ng 4 & Tr\u1EF1c tuy\u1EBFn Zoom Meeting cho thuy\u1EC1n vi\xEAn \u0111ang \u0111i bi\u1EC3n",
    hostOrg: "Kh\u1ED1i 01 ALCM & Ban Nh\xE2n s\u1EF1 Ch\u1EE7 t\xE0u Daiichi Chuo Shipping (Nh\u1EADt B\u1EA3n)",
    hosts: [
      "Capt. Kenji Takahashi (\u0110\u1EA1i di\u1EC7n Tuy\u1EC3n d\u1EE5ng Thuy\u1EC1n vi\xEAn - Tokyo)",
      "Thuy\u1EC1n tr\u01B0\u1EDFng Nguy\u1EC5n V\u0103n H\u1EA3i (Gi\xE1m \u0111\u1ED1c Kh\u1ED1i 01 - ALCM)",
      "M\xE1y tr\u01B0\u1EDFng L\xEA Quang Vinh (Tr\u01B0\u1EDFng Ban \u0110\xE1nh gi\xE1 K\u1EF9 thu\u1EADt STCW)"
    ],
    description: "Ch\u01B0\u01A1ng tr\xECnh ph\u1ECFng v\u1EA5n tuy\u1EC3n ch\u1ECDn tr\u1EF1c ti\u1EBFp cho \u0111\u1ED9i t\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m 19,000 - 45,000 DWT. Trao offer l\u01B0\u01A1ng USD v\xE0 k\xFD k\u1EBFt h\u1EE3p \u0111\u1ED3ng chu\u1EA9n MLC 2006 ngay trong ng\xE0y \u0111\u1ED1i v\u1EDBi c\xE1c \u1EE9ng vi\xEAn \u0111\u1EA1t ti\xEAu chu\u1EA9n.",
    targetAudience: "Thuy\u1EC1n tr\u01B0\u1EDFng (Master), M\xE1y tr\u01B0\u1EDFng (C/E), \u0110\u1EA1i ph\xF3 (C/O), M\xE1y 2 (2/E), Th\u1EE7y th\u1EE7 AB v\xE0 Th\u1EE3 m\xE1y Oiler \u0111\xE3 c\xF3 ch\u1EE9ng ch\u1EC9 STCW.",
    highlights: [
      "Ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp c\xF9ng \u0111\u1EA1i di\u1EC7n ch\u1EE7 t\xE0u Nh\u1EADt B\u1EA3n, c\xF3 phi\xEAn d\u1ECBch h\u1ED7 tr\u1EE3",
      "\u0110\xE1nh gi\xE1 ti\u1EBFng Anh h\xE0ng h\u1EA3i SMCP v\xE0 ki\u1EC3m tra h\u1ED3 s\u01A1 ch\u1EE9ng ch\u1EC9 mi\u1EC5n ph\xED",
      "Nh\u1EADn th\u01B0 m\u1EDDi l\xE0m vi\u1EC7c (Job Offer) m\u1EE9c l\u01B0\u01A1ng t\u1EEB $1,200 - $6,800/th\xE1ng ngay trong ng\xE0y",
      "H\u1ED7 tr\u1EE3 to\xE0n b\u1ED9 chi ph\xED kh\xE1m s\u1EE9c kh\u1ECFe P&I v\xE0 th\u1EE7 t\u1EE5c visa xu\u1EA5t c\u1EA3nh"
    ],
    maxSeats: 40,
    registeredCount: 32,
    status: "almost_full"
  },
  {
    id: "EVT-02",
    title: "H\u1ED9i th\u1EA3o H\u01B0\u1EDBng nghi\u1EC7p: C\u01A1 h\u1ED9i Ngh\u1EC1 nghi\u1EC7p K\u1EF9 s\u01B0 C\u01A1 kh\xED & T\u1EF1 \u0111\u1ED9ng ho\xE1 t\u1EA1i Nh\u1EADt B\u1EA3n",
    type: "seminar_labour",
    typeLabel: "H\u1ED9i th\u1EA3o XKL\u0110 & K\u1EF9 s\u01B0",
    date: "24/10/2026",
    dateIso: "2026-10-24",
    time: "09:00 - 11:30",
    dayOfWeek: "Th\u1EE9 B\u1EA3y",
    locationType: "onsite",
    locationAddress: "T\xF2a nh\xE0 Saigon View Office, 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh, TP.HCM",
    roomOrPlatform: "H\u1ED9i tr\u01B0\u1EDDng L\u1EDBn T\u1EA7ng 2 (C\xF3 truy\u1EC1n h\xECnh tr\u1EF1c ti\u1EBFp cho \u1EE9ng vi\xEAn \u1EDF xa)",
    hostOrg: "Kh\u1ED1i 03 - Ph\xF2ng Nghi\u1EC7p v\u1EE5 Qu\u1EA3n l\xFD Lao \u0111\u1ED9ng N\u01B0\u1EDBc ngo\xE0i & Nghi\u1EC7p \u0111o\xE0n Aichi Kanto",
    hosts: [
      "\xD4ng Shunsuke Sato (Ch\u1EE7 t\u1ECBch Hi\u1EC7p h\u1ED9i H\u1ED7 tr\u1EE3 K\u1EF9 thu\u1EADt C\xF4ng nghi\u1EC7p Aichi)",
      "B\xE0 Tr\u1EA7n Thu H\u1EB1ng (Ph\xF3 Gi\xE1m \u0111\u1ED1c Kh\u1ED1i 03 ALCM)",
      "K\u1EF9 s\u01B0 Ph\u1EA1m V\u0103n H\xF9ng (C\u1EF1u K\u1EF9 s\u01B0 ALCM \u0111\xE3 \u0111\u1ECBnh c\u01B0 5 n\u0103m t\u1EA1i Nh\u1EADt B\u1EA3n chia s\u1EBB)"
    ],
    description: "T\xECm hi\u1EC3u l\u1ED9 tr\xECnh l\xE0m vi\u1EC7c di\u1EC7n Visa K\u1EF9 s\u01B0 k\u1EF9 thu\u1EADt ch\u1EA5t l\u01B0\u1EE3ng cao (kh\xF4ng ph\u1EA3i th\u1EF1c t\u1EADp sinh). M\u1EE9c l\u01B0\u01A1ng 42 - 58 tri\u1EC7u VN\u0110/th\xE1ng, b\u1EA3o l\xE3nh v\u1EE3 con v\xE0 c\u01A1 h\u1ED9i chuy\u1EC3n \u0111\u1ED5i visa v\u0129nh tr\xFA.",
    targetAudience: "Sinh vi\xEAn t\u1ED1t nghi\u1EC7p Cao \u0111\u1EB3ng, \u0110\u1EA1i h\u1ECDc chuy\xEAn ng\xE0nh C\u01A1 kh\xED, Ch\u1EBF t\u1EA1o m\xE1y, T\u1EF1 \u0111\u1ED9ng ho\xE1, \u0110i\u1EC7n - \u0110i\u1EC7n t\u1EED, C\xF4ng ngh\u1EC7 th\xF4ng tin.",
    highlights: [
      "\u0110\u01B0\u1EE3c t\u01B0 v\u1EA5n l\u1ED9 tr\xECnh h\u1ECDc ti\u1EBFng Nh\u1EADt N4/N3 v\u1EDBi h\u1ECDc b\u1ED5ng 100% h\u1ECDc ph\xED",
      "S\u01A1 tuy\u1EC3n tr\u1EF1c ti\u1EBFp h\u1ED3 s\u01A1 t\u1ED1t nghi\u1EC7p v\xE0 ph\u1ECFng v\u1EA5n th\u1EED c\xF9ng chuy\xEAn gia Nh\u1EADt",
      "Gi\u1EA3i \u0111\xE1p chi ti\u1EBFt quy\u1EC1n l\u1EE3i b\u1EA3o hi\u1EC3m, nh\xE0 \u1EDF, thu\u1EBF v\xE0 th\u1EE7 t\u1EE5c b\u1EA3o l\xE3nh gia \u0111\xECnh",
      'T\u1EB7ng c\u1EA9m nang "H\xE0nh trang K\u1EF9 s\u01B0 C\xF4ng ngh\u1EC7 t\u1EA1i Nh\u1EADt B\u1EA3n 2026"'
    ],
    maxSeats: 80,
    registeredCount: 65,
    status: "almost_full"
  },
  {
    id: "EVT-03",
    title: "Ph\u1ECFng v\u1EA5n Tuy\u1EC3n ch\u1ECDn To\xE0n b\u1ED9 Thuy\u1EC1n b\u1ED9 T\xE0u H\xF3a ch\u1EA5t Vi\u1EC5n d\u01B0\u01A1ng Singapore 25,000 DWT",
    type: "interview_crew",
    typeLabel: "Ph\u1ECFng v\u1EA5n Thuy\u1EC1n vi\xEAn",
    date: "29/10/2026",
    dateIso: "2026-10-29",
    time: "13:30 - 17:30",
    dayOfWeek: "Th\u1EE9 N\u0103m",
    locationType: "hybrid",
    locationAddress: "T\xF2a nh\xE0 Saigon View Office, 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh, TP.HCM",
    roomOrPlatform: "Ph\xF2ng Ph\u1ECFng v\u1EA5n Tr\u1EF1c tuy\u1EBFn Kh\u1ED1i 01 & Google Meet / Zoom",
    hostOrg: "Kh\u1ED1i 01 ALCM & Ban Khai th\xE1c T\xE0u Pacific Tanker Singapore",
    hosts: [
      "Capt. Bernard Tan (Director of Fleet Personnel - Singapore)",
      "Thuy\u1EC1n ph\xF3 Tr\u1EA7n Qu\u1ED1c B\u1EA3o (Chuy\xEAn vi\xEAn Nh\xE2n s\u1EF1 Thuy\u1EC1n vi\xEAn ALCM)"
    ],
    description: "Tuy\u1EC3n d\u1EE5ng kh\u1EA9n c\u1EA5p \u0111\u1EE3t 2 tr\u1ECDn b\u1ED9 24 thuy\u1EC1n vi\xEAn cho t\xE0u h\xF3a ch\u1EA5t IMO II nh\u1EADn t\xE0u t\u1EA1i Singapore \u0111\u1EA7u th\xE1ng 12/2026. L\u01B0\u01A1ng th\u01B0\u1EDFng c\u1EA1nh tranh v\xE0 ph\u1EE5 c\u1EA5p t\xE0u h\xF3a ch\u1EA5t \u0111\u1ED9c h\u1EA1i.",
    targetAudience: "S\u0129 quan boong/m\xE1y c\xF3 ch\u1EE9ng ch\u1EC9 t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t n\xE2ng cao (Advanced Oil/Chemical Tanker Cargo Operations), Th\u1EE3 \u0111i\u1EC7n ETO, Th\u1EE3 h\xE0n Fitter, B\u1EBFp tr\u01B0\u1EDFng.",
    highlights: [
      "Tuy\u1EC3n \u0111\u1EE7 m\u1ECDi ch\u1EE9c danh t\u1EEB S\u0129 quan \u0111\u1EBFn Th\u1EE7y th\u1EE7/Th\u1EE3 m\xE1y",
      "Nh\u1EADn t\xE0u ngay trong th\xE1ng 12/2026 t\u1EA1i C\u1EA3ng Jurong, Singapore",
      "\u0110\xE0i th\u1ECD 100% v\xE9 m\xE1y bay kh\u1EE9 h\u1ED3i, l\u01B0u tr\xFA kh\xE1ch s\u1EA1n qu\u1ED1c t\u1EBF",
      "Ch\u1EBF \u0111\u1ED9 b\u1EA3o hi\u1EC3m P&I to\xE0n di\u1EC7n theo chu\u1EA9n H\u1EE3p \u0111\u1ED3ng Thuy\u1EC1n vi\xEAn Qu\u1ED1c t\u1EBF"
    ],
    maxSeats: 35,
    registeredCount: 19,
    status: "open"
  },
  {
    id: "EVT-04",
    title: "Ng\xE0y h\u1ED9i \u0110\u1ECBnh h\u01B0\u1EDBng Du h\u1ECDc Ngh\u1EC1 & \u0110i\u1EC1u d\u01B0\u1EE1ng Vi\xEAn Qu\u1ED1c t\u1EBF t\u1EA1i CHLB \u0110\u1EE9c",
    type: "seminar_germany",
    typeLabel: "H\u1ED9i th\u1EA3o \u0110\u1EE9c & Du h\u1ECDc",
    date: "04/11/2026",
    dateIso: "2026-11-04",
    time: "08:30 - 12:00",
    dayOfWeek: "Th\u1EE9 T\u01B0",
    locationType: "onsite",
    locationAddress: "T\xF2a nh\xE0 Saigon View Office, 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh, TP.HCM",
    roomOrPlatform: "H\u1ED9i tr\u01B0\u1EDDng Kh\u1ED1i 04 & Trung t\xE2m T\u01B0 v\u1EA5n Du h\u1ECDc ALCM",
    hostOrg: "Kh\u1ED1i 04 ALCM ph\u1ED1i h\u1EE3p T\u1EADp \u0111o\xE0n Y t\u1EBF & Vi\u1EC7n D\u01B0\u1EE1ng L\xE3o Li\xEAn bang \u0110\u1EE9c (Diakonie)",
    hosts: [
      "B\xE0 Claudia Schmidt (Tr\u01B0\u1EDFng \u0110\u1EA1i di\u1EC7n Tuy\u1EC3n ch\u1ECDn Nh\xE2n s\u1EF1 Y t\u1EBF Bang Hessen, \u0110\u1EE9c)",
      "ThS. Ho\xE0ng Mai Chi (Gi\xE1m \u0111\u1ED1c Trung t\xE2m Du h\u1ECDc Kh\u1ED1i 04 ALCM)",
      "\u0110\u1EA1i di\u1EC7n Gi\xE1o vi\xEAn b\u1EA3n ng\u1EEF Vi\u1EC7n Goethe"
    ],
    description: "Ch\u01B0\u01A1ng tr\xECnh du h\u1ECDc ngh\u1EC1 k\xE9p \u0111i\u1EC1u d\u01B0\u1EE1ng ho\xE0n to\xE0n mi\u1EC5n 100% h\u1ECDc ph\xED, nh\u1EADn tr\u1EE3 c\u1EA5p th\u1EF1c t\u1EADp t\u1EEB 28 - 36 tri\u1EC7u VN\u0110/th\xE1ng ngay khi c\xF2n \u0111i h\u1ECDc. Sau khi t\u1ED1t nghi\u1EC7p h\u01B0\u1EDFng l\u01B0\u01A1ng ch\xEDnh th\u1EE9c 65 - 85 tri\u1EC7u VN\u0110/th\xE1ng.",
    targetAudience: "B\u1EA1n tr\u1EBB 18 - 35 tu\u1ED5i t\u1ED1t nghi\u1EC7p THPT, Trung c\u1EA5p/Cao \u0111\u1EB3ng Y D\u01B0\u1EE3c ho\u1EB7c ng\u01B0\u1EDDi mong mu\u1ED1n \u0111\u1ECBnh c\u01B0 h\u1EE3p ph\xE1p t\u1EA1i Ch\xE2u \xC2u.",
    highlights: [
      "Mi\u1EC5n 100% h\u1ECDc ph\xED chuy\xEAn ng\xE0nh t\u1EA1i CHLB \u0110\u1EE9c su\u1ED1t 3 n\u0103m \u0111\xE0o t\u1EA1o",
      "Nh\u1EADn h\u1ECDc b\u1ED5ng kh\xF3a ti\u1EBFng \u0110\u1EE9c B1/B2 v\xE0 nh\xE0 \u1EDF t\u1EA1i k\xFD t\xFAc x\xE1 ALCM",
      "H\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng d\xE0i h\u1EA1n v\xE0 cam k\u1EBFt h\u1ED7 tr\u1EE3 xin th\u1EBB xanh \u0111\u1ECBnh c\u01B0 sau 3 n\u0103m l\xE0m vi\u1EC7c",
      "G\u1EB7p g\u1EE1 tr\u1EF1c ti\u1EBFp v\xE0 ph\u1ECFng v\u1EA5n v\u1EDBi \u0111\u1EA1i di\u1EC7n c\xE1c vi\u1EC7n d\u01B0\u1EE1ng l\xE3o t\u1EA1i Frankfurt"
    ],
    maxSeats: 60,
    registeredCount: 41,
    status: "open"
  },
  {
    id: "EVT-05",
    title: "Workshop K\u1EF9 thu\u1EADt: C\u1EADp nh\u1EADt Ti\xEAu chu\u1EA9n Vetting SIRE 2.0 & An to\xE0n H\xE0ng h\u1EA3i T\xE0u D\u1EA7u",
    type: "workshop_stcw",
    typeLabel: "L\u1EDBp b\u1ED3i d\u01B0\u1EE1ng STCW",
    date: "10/11/2026",
    dateIso: "2026-11-10",
    time: "14:00 - 17:30",
    dayOfWeek: "Th\u1EE9 Ba",
    locationType: "hybrid",
    locationAddress: "Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c, 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh, TP.HCM",
    roomOrPlatform: "Ph\xF2ng M\xF4 ph\u1ECFng Bu\u1ED3ng l\xE1i 360 \u0111\u1ED9 (Full Mission Bridge Simulator)",
    hostOrg: "Kh\u1ED1i 02 - Trung t\xE2m Hu\u1EA5n luy\u1EC7n STCW & Ph\xF2ng Ph\xE1p ch\u1EBF An to\xE0n T\xE0u Kh\u1ED1i 01",
    hosts: [
      "Thuy\u1EC1n tr\u01B0\u1EDFng B\xF9i \u0110\u1EE9c Th\u1ECBnh (Thanh tra An to\xE0n H\xE0ng h\u1EA3i & Chuy\xEAn gia SIRE Vetting)",
      "M\xE1y tr\u01B0\u1EDFng V\u0169 \u0110\xECnh Tu\u1EA5n (Tr\u01B0\u1EDFng Ph\xF2ng Hu\u1EA5n luy\u1EC7n M\xF4 ph\u1ECFng STCW)"
    ],
    description: "Kh\xF3a b\u1ED3i d\u01B0\u1EE1ng chuy\xEAn \u0111\u1EC1 c\u1EADp nh\u1EADt b\u1ED9 c\xE2u h\u1ECFi ki\u1EC3m tra k\u1EF9 thu\u1EADt SIRE 2.0 m\u1EDBi nh\u1EA5t c\u1EE7a OCIMF d\xE0nh cho s\u0129 quan t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t. Th\u1EF1c h\xE0nh x\u1EED l\xFD t\xECnh hu\u1ED1ng kh\u1EA9n c\u1EA5p tr\xEAn bu\u1ED3ng l\xE1i m\xF4 ph\u1ECFng 360 \u0111\u1ED9.",
    targetAudience: "Thuy\u1EC1n tr\u01B0\u1EDFng, S\u0129 quan boong, S\u0129 quan m\xE1y chu\u1EA9n b\u1ECB l\xE0m vetting v\u1EDBi c\xE1c t\u1EADp \u0111o\xE0n d\u1EA7u kh\xED l\u1EDBn (Shell, BP, ExxonMobil, Chevron, Total).",
    highlights: [
      "Ph\xE2n t\xEDch chi ti\u1EBFt 15 l\u1ED7i th\u01B0\u1EDDng g\u1EB7p trong \u0111\u1EE3t ki\u1EC3m tra SIRE 2.0 th\u1EF1c t\u1EBF",
      "Tr\u1EF1c ti\u1EBFp tr\u1EA3i nghi\u1EC7m v\xE0 x\u1EED l\xFD s\u1EF1 c\u1ED1 tr\xEAn ph\u1EA7n m\u1EC1m m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i 360 \u0111\u1ED9",
      "C\u1EA5p gi\u1EA5y ch\u1EE9ng nh\u1EADn tham gia b\u1ED3i d\u01B0\u1EE1ng chuy\xEAn \u0111\u1EC1 c\u1EE7a Trung t\xE2m Hu\u1EA5n luy\u1EC7n ALCM",
      "Mi\u1EC5n ph\xED 100% cho to\xE0n b\u1ED9 thuy\u1EC1n vi\xEAn \u0111ang trong bi\xEAn ch\u1EBF \u0111\u1ED9i t\xE0u \xC2u L\u1EA1c"
    ],
    maxSeats: 30,
    registeredCount: 26,
    status: "almost_full"
  }
];
var CREW_TESTIMONIALS = [
  {
    id: "TEST-01",
    name: "Thuy\u1EC1n tr\u01B0\u1EDFng Nguy\u1EC5n V\u0103n To\xE0n",
    role: "Thuy\u1EC1n tr\u01B0\u1EDFng Vi\u1EC5n d\u01B0\u01A1ng (Master Mariner)",
    department: "Kh\u1ED1i 01: Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    vesselOrCompany: "T\xE0u Ch\u1EDF D\u1EA7u Th\xF4 VLCC 105,000 DWT",
    rating: 5,
    quote: "T\xF4i \u0111\xE3 g\u1EAFn b\xF3 c\xF9ng ALCM qua 4 h\u1EE3p \u0111\u1ED3ng vi\u1EC5n d\u01B0\u01A1ng. Quy tr\xECnh \u0111i\u1EC1u \u0111\u1ED9ng chuy\xEAn nghi\u1EC7p, minh b\u1EA1ch 100% v\u1EC1 ph\u1EE5 c\u1EA5p v\xE0 b\u1EA3o hi\u1EC3m P&I qu\u1ED1c t\u1EBF. Khi l\xEAn t\xE0u, quy\u1EC1n l\u1EE3i c\u1EE7a anh em lu\xF4n \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7 t\u1ED1i \u0111a theo chu\u1EA9n MLC 2006.",
    placedYear: "2024 - 2026",
    locationOrFlag: "C\u1EDD Panama \xB7 Ch\u1EE7 t\xE0u Nh\u1EADt B\u1EA3n",
    verifiedStatus: "\u0110\xE3 ho\xE0n th\xE0nh 4 h\u1EE3p \u0111\u1ED3ng an to\xE0n",
    avatarInitials: "NVT"
  },
  {
    id: "TEST-02",
    name: "M\xE1y hai L\xEA Ho\xE0ng Nam",
    role: "S\u0129 quan M\xE1y Hai (Second Engineer)",
    department: "Kh\u1ED1i 01: Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    vesselOrCompany: "T\xE0u H\xF3a Ch\u1EA5t IMO II Chem Sirius 25,000 DWT",
    rating: 5,
    quote: "H\u1EC7 th\u1ED1ng hu\u1EA5n luy\u1EC7n m\xF4 ph\u1ECFng bu\u1ED3ng m\xE1y c\u1EE7a ALCM gi\xFAp t\xF4i t\u1EF1 tin v\u01B0\u1EE3t qua \u0111\u1EE3t vetting SIRE 2.0 kh\xF3 t\xEDnh c\u1EE7a Shell. Thu nh\u1EADp h\xE0ng th\xE1ng chuy\u1EC3n \u0111\xFAng h\u1EA1n \u0111\u1EBFn t\u1EEBng ng\xE0y, gia \u0111\xECnh \u1EDF nh\xE0 lu\xF4n an t\xE2m tuy\u1EC7t \u0111\u1ED1i.",
    placedYear: "2025 - Nay",
    locationOrFlag: "C\u1EDD Marshall Islands \xB7 C\u1EA3ng Singapore",
    verifiedStatus: "\u0110ang c\xF4ng t\xE1c tr\xEAn t\xE0u Chem Sirius",
    avatarInitials: "LHN"
  },
  {
    id: "TEST-03",
    name: "K\u1EF9 s\u01B0 V\u0169 \u0110\u1EE9c Long",
    role: "K\u1EF9 s\u01B0 C\u01A1 kh\xED T\u1EF1 \u0111\u1ED9ng ho\xE1 CNC",
    department: "Kh\u1ED1i 03: Lao \u0111\u1ED9ng K\u1EF9 thu\u1EADt Qu\u1ED1c t\u1EBF",
    vesselOrCompany: "T\u1EADp \u0111o\xE0n C\u01A1 kh\xED Ch\xEDnh x\xE1c Kanto Seiki (Nagoya)",
    rating: 5,
    quote: "ALCM t\u01B0 v\u1EA5n th\u1EB3ng th\u1EAFn, kh\xF4ng ph\xE1t sinh chi ph\xED \u1EA9n. Sau kh\xF3a \u0111\xE0o t\u1EA1o ti\u1EBFng Nh\u1EADt v\xE0 chuy\xEAn m\xF4n t\u1EA1i vi\u1EC7n, t\xF4i sang Nh\u1EADt di\u1EC7n Visa K\u1EF9 s\u01B0 v\u1EDBi m\u1EE9c thu nh\u1EADp h\u01A1n 48 tri\u1EC7u/th\xE1ng v\xE0 hi\u1EC7n \u0111\xE3 b\u1EA3o l\xE3nh \u0111\u01B0\u1EE3c v\u1EE3 con sang sinh s\u1ED1ng c\xF9ng.",
    placedYear: "2024 - 2026",
    locationOrFlag: "Nagoya, Nh\u1EADt B\u1EA3n",
    verifiedStatus: "Visa K\u1EF9 s\u01B0 ch\u1EA5t l\u01B0\u1EE3ng cao",
    avatarInitials: "VDL"
  },
  {
    id: "TEST-04",
    name: "Th\u1EE7y th\u1EE7 tr\u01B0\u1EDFng Tr\u1EA7n Quang D\u0169ng",
    role: "Th\u1EE7y th\u1EE7 tr\u01B0\u1EDFng (Bosun)",
    department: "Kh\u1ED1i 01: Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    vesselOrCompany: "\u0110\u1ED9i t\xE0u \xC2u L\u1EA1c Sapphire",
    rating: 5,
    quote: "Anh em th\u1EE7y th\u1EE7 ch\xFAng t\xF4i \u0111i bi\u1EC3n s\u1EE3 nh\u1EA5t l\xE0 c\xF4ng ty ch\u1EADm l\u01B0\u01A1ng ho\u1EB7c b\u1ECF r\u01A1i khi g\u1EB7p s\u1EF1 c\u1ED1 \u1EDF c\u1EA3ng n\u01B0\u1EDBc ngo\xE0i. \u1EDE \xC2u L\u1EA1c, \u0111\u1EA1i di\u1EC7n c\xF4ng ty lu\xF4n t\xFAc tr\u1EF1c h\u1ED7 tr\u1EE3 24/7, \u0111\u1ED3 b\u1EA3o h\u1ED9 v\xE0 su\u1EA5t \u0103n tr\xEAn t\xE0u lu\xF4n \u0111\u1EE7 \u0111\u1EA7y, chu\u1EA9n m\u1EF1c.",
    placedYear: "2023 - Nay",
    locationOrFlag: "T\xE0u D\u1EA7u Qu\u1ED1c T\u1EBF \xB7 \xC2u L\u1EA1c Fleet",
    verifiedStatus: "Th\u1EE7y th\u1EE7 tr\u01B0\u1EDFng 6 n\u0103m th\xE2m ni\xEAn",
    avatarInitials: "TQD"
  },
  {
    id: "TEST-05",
    name: "\u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn \u0110\u1EB7ng Th\u1ECB Th\xF9y Linh",
    role: "Chuy\xEAn vi\xEAn \u0110i\u1EC1u d\u01B0\u1EE1ng L\xE2m s\xE0ng",
    department: "Kh\u1ED1i 03: Lao \u0111\u1ED9ng K\u1EF9 thu\u1EADt Qu\u1ED1c t\u1EBF",
    vesselOrCompany: "B\u1EC7nh vi\u1EC7n \u0110a khoa Asklepios Klinik (Hamburg)",
    rating: 5,
    quote: "L\u1ED9 tr\xECnh h\u1ECDc ti\u1EBFng \u0110\u1EE9c B2 v\xE0 \u0111\xE0o t\u1EA1o chuy\u1EC3n \u0111\u1ED5i b\u1EB1ng t\u1EA1i ALCM r\u1EA5t b\xE0i b\u1EA3n. Hi\u1EC7n t\u1EA1i m\u1EE9c l\u01B0\u01A1ng c\u1EE7a t\xF4i t\u1EA1i Hamburg \u0111\u1EA1t h\u01A1n 75 tri\u1EC7u VN\u0110/th\xE1ng, ch\u1EBF \u0111\u1ED9 b\u1EA3o hi\u1EC3m y t\u1EBF v\xE0 ngh\u1EC9 ph\xE9p 30 ng\xE0y/n\u0103m nh\u01B0 ng\u01B0\u1EDDi b\u1EA3n x\u1EE9.",
    placedYear: "2024 - Nay",
    locationOrFlag: "Hamburg, CHLB \u0110\u1EE9c",
    verifiedStatus: "\u0110\xE3 c\u1EA5p ch\u1EE9ng ch\u1EC9 h\xE0nh ngh\u1EC1 CHLB \u0110\u1EE9c",
    avatarInitials: "DTL"
  },
  {
    id: "TEST-06",
    name: "S\u0129 quan \u0110i\u1EC7n Ho\xE0ng \u0110\xECnh Th\u1EAFng",
    role: "S\u0129 quan \u0110i\u1EC7n T\xE0u Th\u1EE7y (ETO Officer)",
    department: "Kh\u1ED1i 02: Hu\u1EA5n luy\u1EC7n STCW & \u0110i\u1EC7n t\xE0u th\u1EE7y",
    vesselOrCompany: "T\xE0u Kh\xED H\xF3a L\u1ECFng LNG Carrier 174,000 m\xB3",
    rating: 5,
    quote: "Nh\u1EDD kh\xF3a c\u1EADp nh\u1EADt c\xF4ng ngh\u1EC7 t\u1EF1 \u0111\u1ED9ng h\xF3a v\xE0 ch\u1EE9ng ch\u1EC9 High Voltage t\u1EA1i ALCM, t\xF4i \u0111\u01B0\u1EE3c ch\u1EE7 t\xE0u Na Uy nh\u1EADn th\u1EB3ng v\xE0o t\xE0u LNG th\u1EBF h\u1EC7 m\u1EDBi. \u0110\xE3i ng\u1ED9 v\xE0 m\xF4i tr\u01B0\u1EDDng l\xE0m vi\u1EC7c chuy\xEAn nghi\u1EC7p ngo\xE0i mong \u0111\u1EE3i.",
    placedYear: "2025 - 2026",
    locationOrFlag: "Ch\u1EE7 t\xE0u B\u1EAFc \xC2u \xB7 Na Uy",
    verifiedStatus: "S\u0129 quan \u0111i\u1EC7n t\xE0u chuy\xEAn d\u1EE5ng",
    avatarInitials: "HDT"
  }
];
function replacePublicContent(content) {
  if (Array.isArray(content.divisions)) DIVISIONS = content.divisions;
  if (Array.isArray(content.jobPositions)) JOB_POSITIONS = content.jobPositions;
  if (Array.isArray(content.fleetVessels)) FLEET_VESSELS = content.fleetVessels;
  if (Array.isArray(content.newsArticles)) NEWS_ARTICLES = content.newsArticles;
  if (Array.isArray(content.upcomingEvents)) UPCOMING_EVENTS = content.upcomingEvents;
  if (Array.isArray(content.crewTestimonials)) CREW_TESTIMONIALS = content.crewTestimonials;
}

// db.ts
dotenv.config();
var mysqlConfigured = Boolean(
  process.env.MYSQL_HOST?.trim() && process.env.MYSQL_USER?.trim() && process.env.MYSQL_DATABASE?.trim()
);
var dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "alcm_db",
  charset: "utf8mb4",
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
var pool = mysql.createPool(dbConfig);
var mapApplicationRow = (row) => ({
  id: row.id,
  pin: row.pin,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email,
  positionTitle: row.position_title,
  divisionId: row.division_id,
  cvFileName: row.cv_file_name || void 0,
  cvFileSize: row.cv_file_size || void 0,
  cvFilePath: row.cv_file_path || void 0,
  experienceYears: Number(row.experience_years || 0),
  languageLevel: row.language_level,
  submittedAt: row.submitted_at,
  status: row.status,
  statusProgress: Number(row.status_progress || 0),
  notes: row.notes,
  assignedOfficer: row.assigned_officer,
  departmentEmail: row.department_email
});
async function ensureDatabaseReady() {
  if (!mysqlConfigured) {
    throw new Error("MySQL is not configured. Please add MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE to your .env file.");
  }
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(64) PRIMARY KEY,
        pin VARCHAR(8) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(255) NOT NULL,
        position_title VARCHAR(255) NOT NULL,
        division_id VARCHAR(16) NOT NULL,
        cv_file_name VARCHAR(255) NULL,
        cv_file_size VARCHAR(32) NULL,
        cv_file_path VARCHAR(500) NULL,
        experience_years INT DEFAULT 0,
        language_level VARCHAR(255) NULL,
        submitted_at DATETIME NOT NULL,
        status VARCHAR(128) NOT NULL,
        status_progress INT NOT NULL DEFAULT 0,
        notes TEXT NULL,
        assigned_officer VARCHAR(255) NULL,
        department_email VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const [columnRows] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'applications'
        AND column_name = 'cv_file_path';
    `);
    const existingColumns = columnRows;
    if (Number(existingColumns[0]?.count) === 0) {
      await connection.query(`
        ALTER TABLE applications
        ADD COLUMN cv_file_path VARCHAR(500) NULL AFTER cv_file_size;
      `);
    }
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS referral_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_name VARCHAR(255) NOT NULL,
        candidate_name VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(255) NULL,
        position_title VARCHAR(255) NULL,
        note TEXT NULL,
        referrer_phone VARCHAR(32) NULL,
        referrer_rank VARCHAR(255) NULL,
        candidate_phone VARCHAR(32) NULL,
        candidate_role VARCHAR(255) NULL,
        candidate_notes TEXT NULL,
        tracking_code VARCHAR(64) NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        note TEXT NULL,
        event_id VARCHAR(64) NULL,
        ticket_code VARCHAR(64) NULL UNIQUE,
        event_date VARCHAR(64) NULL,
        event_time VARCHAR(128) NULL,
        location VARCHAR(500) NULL,
        attendance_mode VARCHAR(32) NULL,
        participant_role VARCHAR(255) NULL,
        question TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const interactionColumnMigrations = [
      ["referral_records", "referrer_phone", "VARCHAR(32) NULL"],
      ["referral_records", "referrer_rank", "VARCHAR(255) NULL"],
      ["referral_records", "candidate_phone", "VARCHAR(32) NULL"],
      ["referral_records", "candidate_role", "VARCHAR(255) NULL"],
      ["referral_records", "candidate_notes", "TEXT NULL"],
      ["referral_records", "tracking_code", "VARCHAR(64) NULL UNIQUE"],
      ["event_registrations", "event_id", "VARCHAR(64) NULL"],
      ["event_registrations", "ticket_code", "VARCHAR(64) NULL UNIQUE"],
      ["event_registrations", "event_date", "VARCHAR(64) NULL"],
      ["event_registrations", "event_time", "VARCHAR(128) NULL"],
      ["event_registrations", "location", "VARCHAR(500) NULL"],
      ["event_registrations", "attendance_mode", "VARCHAR(32) NULL"],
      ["event_registrations", "participant_role", "VARCHAR(255) NULL"],
      ["event_registrations", "question", "TEXT NULL"]
    ];
    for (const [tableName, columnName, columnDefinition] of interactionColumnMigrations) {
      const [columnRows2] = await connection.query(
        `SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
        [tableName, columnName]
      );
      if (Number(columnRows2[0]?.count) === 0) {
        await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      }
    }
    await connection.query("ALTER TABLE referral_records MODIFY COLUMN email VARCHAR(255) NULL");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        content_key VARCHAR(100) PRIMARY KEY,
        content_json JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const cmsSchema = [
      `CREATE TABLE IF NOT EXISTS cms_content_migrations (
        content_key VARCHAR(100) PRIMARY KEY,
        source ENUM('legacy', 'defaults', 'existing') NOT NULL,
        migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS cms_content_audit (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        content_key VARCHAR(100) NOT NULL,
        record_count INT UNSIGNED NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cms_audit_key_date (content_key, changed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_media_assets (
        id CHAR(36) PRIMARY KEY,
        original_filename VARCHAR(255) NOT NULL,
        storage_filename VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL UNIQUE,
        mime_type VARCHAR(64) NOT NULL,
        profile ENUM('hero', 'general') NOT NULL,
        compression_mode ENUM('compressed', 'original') NOT NULL,
        original_width INT UNSIGNED NOT NULL,
        original_height INT UNSIGNED NOT NULL,
        original_size_bytes BIGINT UNSIGNED NOT NULL,
        output_width INT UNSIGNED NOT NULL,
        output_height INT UNSIGNED NOT NULL,
        output_size_bytes BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_site_media_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_brand_assets (
        brand_id TINYINT UNSIGNED PRIMARY KEY,
        site_logo_url VARCHAR(1000) NOT NULL,
        site_logo_dark_url VARCHAR(1000) NOT NULL,
        emblem_url VARCHAR(1000) NOT NULL,
        emblem_dark_url VARCHAR(1000) NOT NULL,
        admin_login_logo_url VARCHAR(1000) NOT NULL,
        favicon_url VARCHAR(1000) NOT NULL DEFAULT '/favicon.png',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_site_brand_singleton CHECK (brand_id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_social_links (
        platform VARCHAR(32) PRIMARY KEY,
        url VARCHAR(1000) NOT NULL DEFAULT ''
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS divisions (
        id VARCHAR(16) PRIMARY KEY,
        sort_order INT NOT NULL,
        division_no VARCHAR(8) NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        color CHAR(7) NOT NULL,
        accent CHAR(7) NOT NULL,
        email VARCHAR(255) NOT NULL,
        lead_text TEXT NOT NULL,
        INDEX idx_divisions_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS division_units (
        division_id VARCHAR(16) NOT NULL,
        unit_index INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        PRIMARY KEY (division_id, unit_index),
        CONSTRAINT fk_division_units_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS division_unit_points (
        division_id VARCHAR(16) NOT NULL,
        unit_index INT NOT NULL,
        point_index INT NOT NULL,
        point_text TEXT NOT NULL,
        PRIMARY KEY (division_id, unit_index, point_index),
        CONSTRAINT fk_division_points_unit FOREIGN KEY (division_id, unit_index) REFERENCES division_units(division_id, unit_index) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS division_steps (
        division_id VARCHAR(16) NOT NULL,
        step_index INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_partner BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (division_id, step_index),
        CONSTRAINT fk_division_steps_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS division_related_units (
        division_id VARCHAR(16) NOT NULL,
        related_index INT NOT NULL,
        related_division_id VARCHAR(16) NOT NULL,
        unit_index INT NOT NULL,
        PRIMARY KEY (division_id, related_index),
        CONSTRAINT fk_related_source_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
        CONSTRAINT fk_related_target_unit FOREIGN KEY (related_division_id, unit_index) REFERENCES division_units(division_id, unit_index) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS job_categories (
        name VARCHAR(100) PRIMARY KEY
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS job_positions (
        id VARCHAR(64) PRIMARY KEY,
        sort_order INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        division_id VARCHAR(16) NOT NULL,
        category VARCHAR(100) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        ship_type_or_industry VARCHAR(255) NOT NULL,
        salary_range VARCHAR(255) NOT NULL,
        contract_duration VARCHAR(100) NOT NULL,
        deadline VARCHAR(100) NOT NULL,
        quota INT NOT NULL DEFAULT 0,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        INDEX idx_jobs_division (division_id),
        INDEX idx_jobs_category (category),
        CONSTRAINT fk_jobs_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE RESTRICT,
        CONSTRAINT fk_jobs_category FOREIGN KEY (category) REFERENCES job_categories(name) ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS job_position_requirements (
        job_id VARCHAR(64) NOT NULL,
        requirement_index INT NOT NULL,
        requirement_text TEXT NOT NULL,
        PRIMARY KEY (job_id, requirement_index),
        CONSTRAINT fk_job_requirements_job FOREIGN KEY (job_id) REFERENCES job_positions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS job_position_benefits (
        job_id VARCHAR(64) NOT NULL,
        benefit_index INT NOT NULL,
        benefit_text TEXT NOT NULL,
        PRIMARY KEY (job_id, benefit_index),
        CONSTRAINT fk_job_benefits_job FOREIGN KEY (job_id) REFERENCES job_positions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS fleet_vessels (
        id VARCHAR(64) PRIMARY KEY,
        sort_order INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        vessel_type VARCHAR(100) NOT NULL,
        dwt VARCHAR(100) NOT NULL,
        built_year SMALLINT NOT NULL,
        flag VARCHAR(100) NOT NULL,
        trading_area VARCHAR(255) NOT NULL,
        crew_complement VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS news_articles (
        id VARCHAR(64) PRIMARY KEY,
        sort_order INT NOT NULL,
        category VARCHAR(150) NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary TEXT NOT NULL,
        publish_date VARCHAR(32) NOT NULL,
        read_time VARCHAR(64) NOT NULL,
        cover_image VARCHAR(1000) NULL,
        article_body MEDIUMTEXT NULL,
        INDEX idx_news_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS upcoming_events (
        id VARCHAR(64) PRIMARY KEY,
        sort_order INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        event_type ENUM('interview_crew', 'seminar_labour', 'seminar_germany', 'workshop_stcw') NOT NULL,
        type_label VARCHAR(150) NOT NULL,
        event_date VARCHAR(32) NOT NULL,
        date_iso DATE NOT NULL,
        event_time VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(32) NOT NULL,
        location_type ENUM('onsite', 'online', 'hybrid') NOT NULL,
        location_address VARCHAR(500) NOT NULL,
        room_or_platform VARCHAR(500) NOT NULL,
        host_org VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        max_seats INT NOT NULL DEFAULT 0,
        registered_count INT NOT NULL DEFAULT 0,
        status ENUM('open', 'almost_full', 'closed') NOT NULL,
        google_calendar_url VARCHAR(1000) NULL,
        INDEX idx_events_date (date_iso),
        INDEX idx_events_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS event_hosts (
        event_id VARCHAR(64) NOT NULL,
        host_index INT NOT NULL,
        host_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (event_id, host_index),
        CONSTRAINT fk_event_hosts_event FOREIGN KEY (event_id) REFERENCES upcoming_events(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS event_highlights (
        event_id VARCHAR(64) NOT NULL,
        highlight_index INT NOT NULL,
        highlight_text TEXT NOT NULL,
        PRIMARY KEY (event_id, highlight_index),
        CONSTRAINT fk_event_highlights_event FOREIGN KEY (event_id) REFERENCES upcoming_events(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS crew_testimonials (
        id VARCHAR(64) PRIMARY KEY,
        sort_order INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        vessel_or_company VARCHAR(255) NOT NULL,
        rating TINYINT UNSIGNED NOT NULL,
        quote TEXT NOT NULL,
        placed_year VARCHAR(32) NOT NULL,
        location_or_flag VARCHAR(255) NOT NULL,
        verified_status VARCHAR(255) NOT NULL,
        avatar_initials VARCHAR(24) NOT NULL,
        CONSTRAINT chk_testimonial_rating CHECK (rating <= 5)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS hero_slides (
        sort_order INT PRIMARY KEY,
        image_src VARCHAR(1000) NOT NULL,
        tag VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS homepage_ticker_items (
        sort_order INT PRIMARY KEY,
        item_text TEXT NOT NULL,
        display_time VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS campaign_projects (
        project_id INT AUTO_INCREMENT PRIMARY KEY,
        sort_order INT NOT NULL UNIQUE,
        title VARCHAR(500) NOT NULL,
        tag VARCHAR(255) NOT NULL,
        salary VARCHAR(255) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        deadline VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        route VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS referral_reward_tiers (
        tier_id INT AUTO_INCREMENT PRIMARY KEY,
        sort_order INT NOT NULL UNIQUE,
        rank_name VARCHAR(255) NOT NULL,
        roles TEXT NOT NULL,
        reward VARCHAR(255) NOT NULL,
        highlight BOOLEAN NOT NULL DEFAULT FALSE,
        condition_text TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_languages (
        language_code VARCHAR(8) PRIMARY KEY,
        language_name VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_translations (
        language_code VARCHAR(8) NOT NULL,
        translation_key VARCHAR(150) NOT NULL,
        translation_value TEXT NOT NULL,
        PRIMARY KEY (language_code, translation_key),
        CONSTRAINT fk_translations_language FOREIGN KEY (language_code) REFERENCES site_languages(language_code) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS site_content_localizations (
        content_key VARCHAR(100) NOT NULL,
        record_index INT UNSIGNED NOT NULL,
        language_code VARCHAR(8) NOT NULL,
        field_path VARCHAR(500) NOT NULL,
        translated_text TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (content_key, record_index, language_code, field_path),
        INDEX idx_content_locale (content_key, language_code),
        CONSTRAINT fk_localized_content_language FOREIGN KEY (language_code) REFERENCES site_languages(language_code) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];
    for (const statement of cmsSchema) {
      await connection.query(statement);
    }
    const [faviconColumnRows] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'site_brand_assets'
        AND column_name = 'favicon_url';
    `);
    if (Number(faviconColumnRows[0]?.count) === 0) {
      await connection.query("ALTER TABLE site_brand_assets ADD COLUMN favicon_url VARCHAR(1000) NOT NULL DEFAULT '/favicon.png'");
    }
    let newsArticleColumnsAdded = false;
    for (const [column, definition] of [
      ["cover_image", "VARCHAR(1000) NULL"],
      ["article_body", "MEDIUMTEXT NULL"]
    ]) {
      const [columnRows2] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'news_articles'
          AND column_name = ?;
      `, [column]);
      if (Number(columnRows2[0]?.count) === 0) {
        await connection.query(`ALTER TABLE news_articles ADD COLUMN ${column} ${definition}`);
        newsArticleColumnsAdded = true;
      }
    }
    if (newsArticleColumnsAdded) {
      for (const article of NEWS_ARTICLES) {
        await connection.execute(
          `UPDATE news_articles
           SET cover_image = COALESCE(NULLIF(cover_image, ''), ?),
               article_body = COALESCE(NULLIF(article_body, ''), ?)
           WHERE id = ?`,
          [article.coverImage || null, article.body || null, article.id]
        );
      }
    }
  } finally {
    connection.release();
  }
}
var contentTables = {
  divisions: { table: "divisions", idColumn: "id" },
  jobPositions: { table: "job_positions", idColumn: "id" },
  fleetVessels: { table: "fleet_vessels", idColumn: "id" },
  newsArticles: { table: "news_articles", idColumn: "id" },
  upcomingEvents: { table: "upcoming_events", idColumn: "id" },
  crewTestimonials: { table: "crew_testimonials", idColumn: "id" },
  aboutPage: { table: "site_content", idColumn: "content_key" },
  heroSlides: { table: "hero_slides", idColumn: "sort_order" },
  homepageTicker: { table: "homepage_ticker_items", idColumn: "sort_order" },
  campaignProjects: { table: "campaign_projects", idColumn: "sort_order" },
  referralRewardTiers: { table: "referral_reward_tiers", idColumn: "sort_order" },
  brandAssets: { table: "site_brand_assets", idColumn: "brand_id" },
  socialLinks: { table: "site_social_links", idColumn: "platform" },
  translations: { table: "site_translations", idColumn: "translation_key" }
};
function contentRecords(value, key) {
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error(`Invalid content list for ${key}.`);
  }
  return value;
}
async function insertBatch(connection, table, columns, rows, suffix = "") {
  if (rows.length === 0) return;
  const rowPlaceholder = `(${columns.map(() => "?").join(", ")})`;
  const placeholders = rows.map(() => rowPlaceholder).join(", ");
  await connection.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders} ${suffix}`,
    rows.flat()
  );
}
async function deleteMissingRows(connection, table, idColumn, ids) {
  if (ids.length === 0) {
    await connection.query(`DELETE FROM ${table}`);
    return;
  }
  const placeholders = ids.map(() => "?").join(", ");
  await connection.query(`DELETE FROM ${table} WHERE ${idColumn} NOT IN (${placeholders})`, ids);
}
async function replaceSimpleRows(connection, table, columns, rows) {
  await connection.query(`DELETE FROM ${table}`);
  await insertBatch(connection, table, columns, rows);
}
async function replaceSiteContentOnConnection(connection, key, value) {
  switch (key) {
    case "divisions": {
      const items = contentRecords(value, key);
      await insertBatch(
        connection,
        "divisions",
        ["id", "sort_order", "division_no", "name", "short_name", "name_en", "color", "accent", "email", "lead_text"],
        items.map((item, index) => [item.id, index, item.no, item.name, item.short, item.en, item.color, item.accent, item.email, item.lead]),
        `ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), division_no = VALUES(division_no), name = VALUES(name), short_name = VALUES(short_name), name_en = VALUES(name_en), color = VALUES(color), accent = VALUES(accent), email = VALUES(email), lead_text = VALUES(lead_text)`
      );
      await connection.query("DELETE FROM division_related_units");
      await connection.query("DELETE FROM division_units");
      await connection.query("DELETE FROM division_steps");
      const units = [];
      const points = [];
      const steps = [];
      const related = [];
      items.forEach((item, divisionIndex) => {
        (item.units || []).forEach((unit, unitIndex) => {
          units.push([item.id, unitIndex, unit.name, unit.en, unit.desc]);
          (unit.pts || []).forEach((point, pointIndex) => points.push([item.id, unitIndex, pointIndex, point]));
        });
        (item.steps || []).forEach((step, stepIndex) => {
          steps.push([item.id, stepIndex, step.title, step.desc, Boolean(step.isPartner)]);
        });
        (item.related || []).forEach((relation, relatedIndex) => {
          related.push([item.id, relatedIndex, relation.divId, relation.unitIndex]);
        });
      });
      await insertBatch(connection, "division_units", ["division_id", "unit_index", "name", "name_en", "description"], units);
      await insertBatch(connection, "division_unit_points", ["division_id", "unit_index", "point_index", "point_text"], points);
      await insertBatch(connection, "division_steps", ["division_id", "step_index", "title", "description", "is_partner"], steps);
      await insertBatch(connection, "division_related_units", ["division_id", "related_index", "related_division_id", "unit_index"], related);
      await deleteMissingRows(connection, "divisions", "id", items.map((item) => item.id));
      return;
    }
    case "jobPositions": {
      const items = contentRecords(value, key);
      const categories = [...new Set(items.map((item) => String(item.category)))];
      await insertBatch(connection, "job_categories", ["name"], categories.map((category) => [category]), "ON DUPLICATE KEY UPDATE name = VALUES(name)");
      await insertBatch(
        connection,
        "job_positions",
        ["id", "sort_order", "title", "division_id", "category", "destination", "ship_type_or_industry", "salary_range", "contract_duration", "deadline", "quota", "featured"],
        items.map((item, index) => [item.id, index, item.title, item.divisionId, item.category, item.destination, item.shipTypeOrIndustry, item.salaryRange, item.contractDuration, item.deadline, Number(item.quota || 0), Boolean(item.featured)]),
        `ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), title = VALUES(title), division_id = VALUES(division_id), category = VALUES(category), destination = VALUES(destination), ship_type_or_industry = VALUES(ship_type_or_industry), salary_range = VALUES(salary_range), contract_duration = VALUES(contract_duration), deadline = VALUES(deadline), quota = VALUES(quota), featured = VALUES(featured)`
      );
      await connection.query("DELETE FROM job_position_requirements");
      await connection.query("DELETE FROM job_position_benefits");
      const requirements = [];
      const benefits = [];
      items.forEach((item) => {
        (item.requirements || []).forEach((text, index) => requirements.push([item.id, index, text]));
        (item.benefits || []).forEach((text, index) => benefits.push([item.id, index, text]));
      });
      await insertBatch(connection, "job_position_requirements", ["job_id", "requirement_index", "requirement_text"], requirements);
      await insertBatch(connection, "job_position_benefits", ["job_id", "benefit_index", "benefit_text"], benefits);
      await deleteMissingRows(connection, "job_positions", "id", items.map((item) => item.id));
      return;
    }
    case "fleetVessels": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "fleet_vessels", ["id", "sort_order", "name", "vessel_type", "dwt", "built_year", "flag", "trading_area", "crew_complement"], items.map((item, index) => [item.id, index, item.name, item.type, item.dwt, item.builtYear, item.flag, item.tradingArea, item.crewComplement]));
      return;
    }
    case "newsArticles": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "news_articles", ["id", "sort_order", "category", "title", "summary", "publish_date", "read_time", "cover_image", "article_body"], items.map((item, index) => [item.id, index, item.category, item.title, item.summary, item.date, item.readTime, item.coverImage || null, item.body || null]));
      return;
    }
    case "upcomingEvents": {
      const items = contentRecords(value, key);
      await insertBatch(
        connection,
        "upcoming_events",
        ["id", "sort_order", "title", "event_type", "type_label", "event_date", "date_iso", "event_time", "day_of_week", "location_type", "location_address", "room_or_platform", "host_org", "description", "target_audience", "max_seats", "registered_count", "status", "google_calendar_url"],
        items.map((item, index) => [item.id, index, item.title, item.type, item.typeLabel, item.date, item.dateIso, item.time, item.dayOfWeek, item.locationType, item.locationAddress, item.roomOrPlatform, item.hostOrg, item.description, item.targetAudience, Number(item.maxSeats || 0), Number(item.registeredCount || 0), item.status, item.googleCalendarUrl || null]),
        `ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), title = VALUES(title), event_type = VALUES(event_type), type_label = VALUES(type_label), event_date = VALUES(event_date), date_iso = VALUES(date_iso), event_time = VALUES(event_time), day_of_week = VALUES(day_of_week), location_type = VALUES(location_type), location_address = VALUES(location_address), room_or_platform = VALUES(room_or_platform), host_org = VALUES(host_org), description = VALUES(description), target_audience = VALUES(target_audience), max_seats = VALUES(max_seats), registered_count = VALUES(registered_count), status = VALUES(status), google_calendar_url = VALUES(google_calendar_url)`
      );
      await connection.query("DELETE FROM event_hosts");
      await connection.query("DELETE FROM event_highlights");
      const hosts = [];
      const highlights = [];
      items.forEach((item) => {
        (item.hosts || []).forEach((host, index) => hosts.push([item.id, index, host]));
        (item.highlights || []).forEach((highlight, index) => highlights.push([item.id, index, highlight]));
      });
      await insertBatch(connection, "event_hosts", ["event_id", "host_index", "host_name"], hosts);
      await insertBatch(connection, "event_highlights", ["event_id", "highlight_index", "highlight_text"], highlights);
      await deleteMissingRows(connection, "upcoming_events", "id", items.map((item) => item.id));
      return;
    }
    case "crewTestimonials": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "crew_testimonials", ["id", "sort_order", "name", "role", "department", "vessel_or_company", "rating", "quote", "placed_year", "location_or_flag", "verified_status", "avatar_initials"], items.map((item, index) => [item.id, index, item.name, item.role, item.department, item.vesselOrCompany, Number(item.rating), item.quote, item.placedYear, item.locationOrFlag, item.verifiedStatus, item.avatarInitials]));
      return;
    }
    case "aboutPage": {
      const items = contentRecords(value, key);
      if (items.length !== 1 || items[0].id !== "about-alcm") throw new Error("About ALCM must be stored as one singleton record.");
      await connection.execute(
        `INSERT INTO site_content (content_key, content_json) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)`,
        [key, JSON.stringify(items)]
      );
      return;
    }
    case "heroSlides": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "hero_slides", ["sort_order", "image_src", "tag", "title", "description"], items.map((item, index) => [index, item.src, item.tag, item.title, item.desc]));
      return;
    }
    case "homepageTicker": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "homepage_ticker_items", ["sort_order", "item_text", "display_time"], items.map((item, index) => [index, item.text, item.time]));
      return;
    }
    case "campaignProjects": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "campaign_projects", ["sort_order", "title", "tag", "salary", "owner", "deadline", "description", "route"], items.map((item, index) => [index, item.title, item.tag, item.salary, item.owner, item.deadline, item.desc, item.route]));
      return;
    }
    case "referralRewardTiers": {
      const items = contentRecords(value, key);
      await replaceSimpleRows(connection, "referral_reward_tiers", ["sort_order", "rank_name", "roles", "reward", "highlight", "condition_text"], items.map((item, index) => [index, item.rank, item.roles, item.reward, Boolean(item.highlight), item.condition]));
      return;
    }
    case "brandAssets": {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid brand assets object.");
      const assets = value;
      await connection.execute(
        `INSERT INTO site_brand_assets (brand_id, site_logo_url, site_logo_dark_url, emblem_url, emblem_dark_url, admin_login_logo_url, favicon_url)
         VALUES (1, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE site_logo_url = VALUES(site_logo_url), site_logo_dark_url = VALUES(site_logo_dark_url), emblem_url = VALUES(emblem_url), emblem_dark_url = VALUES(emblem_dark_url), admin_login_logo_url = VALUES(admin_login_logo_url), favicon_url = VALUES(favicon_url)`,
        [assets.siteLogoUrl, assets.siteLogoDarkUrl, assets.emblemUrl, assets.emblemDarkUrl, assets.adminLoginLogoUrl, assets.faviconUrl || "/favicon.png"]
      );
      return;
    }
    case "socialLinks": {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid social links object.");
      const links = value;
      const platforms = ["facebookUrl", "zaloUrl", "youtubeUrl", "tiktokUrl", "instagramUrl", "linkedinUrl"];
      await replaceSimpleRows(
        connection,
        "site_social_links",
        ["platform", "url"],
        platforms.map((platform) => [platform, String(links[platform] || "")])
      );
      return;
    }
    case "translations": {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid translations object.");
      const translations = value;
      const languages = Object.entries(translations);
      await insertBatch(
        connection,
        "site_languages",
        ["language_code", "language_name"],
        languages.map(([code]) => [code, { vi: "Ti\u1EBFng Vi\u1EC7t", en: "English", ja: "\u65E5\u672C\u8A9E", ko: "\uD55C\uAD6D\uC5B4", zh: "\u4E2D\u6587" }[code] || code]),
        "ON DUPLICATE KEY UPDATE language_name = VALUES(language_name)"
      );
      await connection.query("DELETE FROM site_translations");
      const entries = [];
      languages.forEach(([code, fields]) => {
        Object.entries(fields || {}).forEach(([translationKey, translationValue]) => {
          if (translationKey === "siteCopy" && translationValue && typeof translationValue === "object" && !Array.isArray(translationValue)) {
            Object.entries(translationValue).forEach(([copyKey, copyValue]) => {
              if (typeof copyValue === "string") entries.push([code, `siteCopy.${copyKey}`, copyValue]);
            });
          } else if (typeof translationValue === "string") {
            entries.push([code, translationKey, translationValue]);
          }
        });
      });
      await insertBatch(connection, "site_translations", ["language_code", "translation_key", "translation_value"], entries);
      return;
    }
    default:
      throw new Error(`Unsupported CMS content key: ${key}`);
  }
}
async function replaceSiteContentLocalizations(connection, key, value) {
  if (!Array.isArray(value)) return;
  await connection.execute("DELETE FROM site_content_localizations WHERE content_key = ?", [key]);
  const rows = [];
  value.forEach((item, recordIndex) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const localizations = item._translations;
    if (!localizations || typeof localizations !== "object" || Array.isArray(localizations)) return;
    Object.entries(localizations).forEach(([language, fields]) => {
      if (!["en", "ja", "ko", "zh"].includes(language) || !fields || typeof fields !== "object") return;
      Object.entries(fields).forEach(([fieldPath, translatedText]) => {
        if (typeof translatedText === "string") rows.push([key, recordIndex, language, fieldPath, translatedText]);
      });
    });
  });
  await insertBatch(
    connection,
    "site_content_localizations",
    ["content_key", "record_index", "language_code", "field_path", "translated_text"],
    rows
  );
}
async function normalizedContentExists(connection, key) {
  const table = contentTables[key]?.table;
  if (!table) throw new Error(`Unknown CMS content key: ${key}`);
  const [rows] = key === "aboutPage" ? await connection.execute("SELECT COUNT(*) AS row_count FROM site_content WHERE content_key = ?", [key]) : await connection.query(`SELECT COUNT(*) AS row_count FROM ${table}`);
  return Number(rows[0]?.row_count || 0) > 0;
}
function parseLegacyContent(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}
async function seedSiteContentDefaults(defaults) {
  const connection = await pool.getConnection();
  try {
    for (const [key, defaultValue] of Object.entries(defaults)) {
      await connection.beginTransaction();
      try {
        const [insertResult] = await connection.execute(
          `INSERT IGNORE INTO cms_content_migrations (content_key, source) VALUES (?, 'defaults')`,
          [key]
        );
        if (insertResult.affectedRows === 0) {
          if (key === "aboutPage") {
            const [aboutRows] = await connection.execute(
              "SELECT content_json FROM site_content WHERE content_key = ? LIMIT 1",
              [key]
            );
            const aboutRow = aboutRows[0];
            const defaults2 = contentRecords(defaultValue, key);
            const existing = aboutRow ? contentRecords(parseLegacyContent(aboutRow.content_json), key) : [];
            const defaultRecord = defaults2[0];
            const existingRecord = existing[0] || {};
            const defaultTranslations = defaultRecord._translations || {};
            const existingTranslations = existingRecord._translations || {};
            const languages = /* @__PURE__ */ new Set([...Object.keys(defaultTranslations), ...Object.keys(existingTranslations)]);
            const mergedRecord = {
              ...defaultRecord,
              ...existingRecord,
              _translations: Object.fromEntries([...languages].map((language) => [
                language,
                { ...defaultTranslations[language] || {}, ...existingTranslations[language] || {} }
              ]))
            };
            for (const imageField of ["roomSignImageOne", "roomSignImageTwo"]) {
              const existingImage = existingRecord[imageField];
              if (typeof existingImage !== "string" || !existingImage.trim()) {
                mergedRecord[imageField] = defaultRecord[imageField];
              }
            }
            const merged = [mergedRecord];
            if (JSON.stringify(merged) !== JSON.stringify(existing)) {
              await replaceSiteContentOnConnection(connection, key, merged);
              await replaceSiteContentLocalizations(connection, key, merged);
            }
          }
          await connection.commit();
          continue;
        }
        let source = "defaults";
        let value = defaultValue;
        if (await normalizedContentExists(connection, key)) {
          source = "existing";
        } else {
          const [legacyRows] = await connection.execute(
            "SELECT content_json FROM site_content WHERE content_key = ? LIMIT 1",
            [key]
          );
          const legacy = legacyRows[0];
          if (legacy) {
            source = "legacy";
            value = parseLegacyContent(legacy.content_json);
          }
          await replaceSiteContentOnConnection(connection, key, value);
          await replaceSiteContentLocalizations(connection, key, value);
        }
        await connection.execute(
          "UPDATE cms_content_migrations SET source = ? WHERE content_key = ?",
          [source, key]
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    connection.release();
  }
}
async function getSiteContent() {
  const connection = await pool.getConnection();
  try {
    const [divisionRows] = await connection.query("SELECT * FROM divisions ORDER BY sort_order");
    const [unitRows] = await connection.query("SELECT * FROM division_units ORDER BY division_id, unit_index");
    const [pointRows] = await connection.query("SELECT * FROM division_unit_points ORDER BY division_id, unit_index, point_index");
    const [stepRows] = await connection.query("SELECT * FROM division_steps ORDER BY division_id, step_index");
    const [relatedRows] = await connection.query("SELECT * FROM division_related_units ORDER BY division_id, related_index");
    const pointsByUnit = /* @__PURE__ */ new Map();
    for (const row of pointRows) {
      const key = `${row.division_id}:${row.unit_index}`;
      pointsByUnit.set(key, [...pointsByUnit.get(key) || [], row.point_text]);
    }
    const divisions = divisionRows.map((row) => ({
      id: row.id,
      no: row.division_no,
      name: row.name,
      short: row.short_name,
      en: row.name_en,
      color: row.color,
      accent: row.accent,
      email: row.email,
      lead: row.lead_text,
      units: unitRows.filter((unit) => unit.division_id === row.id).map((unit) => ({
        name: unit.name,
        en: unit.name_en,
        desc: unit.description,
        pts: pointsByUnit.get(`${row.id}:${unit.unit_index}`) || []
      })),
      steps: stepRows.filter((step) => step.division_id === row.id).map((step) => ({
        title: step.title,
        desc: step.description,
        ...step.is_partner ? { isPartner: true } : {}
      })),
      related: relatedRows.filter((relation) => relation.division_id === row.id).map((relation) => ({
        divId: relation.related_division_id,
        unitIndex: Number(relation.unit_index)
      }))
    }));
    const [jobRows] = await connection.query("SELECT * FROM job_positions ORDER BY sort_order");
    const [requirementRows] = await connection.query("SELECT * FROM job_position_requirements ORDER BY job_id, requirement_index");
    const [benefitRows] = await connection.query("SELECT * FROM job_position_benefits ORDER BY job_id, benefit_index");
    const jobPositions = jobRows.map((row) => ({
      id: row.id,
      title: row.title,
      divisionId: row.division_id,
      category: row.category,
      destination: row.destination,
      shipTypeOrIndustry: row.ship_type_or_industry,
      salaryRange: row.salary_range,
      contractDuration: row.contract_duration,
      deadline: row.deadline,
      quota: Number(row.quota),
      requirements: requirementRows.filter((item) => item.job_id === row.id).map((item) => item.requirement_text),
      benefits: benefitRows.filter((item) => item.job_id === row.id).map((item) => item.benefit_text),
      ...row.featured ? { featured: true } : {}
    }));
    const [fleetRows] = await connection.query("SELECT * FROM fleet_vessels ORDER BY sort_order");
    const fleetVessels = fleetRows.map((row) => ({ id: row.id, name: row.name, type: row.vessel_type, dwt: row.dwt, builtYear: Number(row.built_year), flag: row.flag, tradingArea: row.trading_area, crewComplement: row.crew_complement }));
    const [newsRows] = await connection.query("SELECT * FROM news_articles ORDER BY sort_order");
    const newsArticles = newsRows.map((row) => ({ id: row.id, category: row.category, title: row.title, summary: row.summary, date: row.publish_date, readTime: row.read_time, coverImage: row.cover_image || "", body: row.article_body || "" }));
    const [eventRows] = await connection.query("SELECT * FROM upcoming_events ORDER BY sort_order");
    const [hostRows] = await connection.query("SELECT * FROM event_hosts ORDER BY event_id, host_index");
    const [highlightRows] = await connection.query("SELECT * FROM event_highlights ORDER BY event_id, highlight_index");
    const upcomingEvents = eventRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.event_type,
      typeLabel: row.type_label,
      date: row.event_date,
      dateIso: typeof row.date_iso === "string" ? row.date_iso.slice(0, 10) : new Date(row.date_iso).toISOString().slice(0, 10),
      time: row.event_time,
      dayOfWeek: row.day_of_week,
      locationType: row.location_type,
      locationAddress: row.location_address,
      roomOrPlatform: row.room_or_platform,
      hostOrg: row.host_org,
      hosts: hostRows.filter((host) => host.event_id === row.id).map((host) => host.host_name),
      description: row.description,
      targetAudience: row.target_audience,
      highlights: highlightRows.filter((highlight) => highlight.event_id === row.id).map((highlight) => highlight.highlight_text),
      maxSeats: Number(row.max_seats),
      registeredCount: Number(row.registered_count),
      status: row.status,
      ...row.google_calendar_url ? { googleCalendarUrl: row.google_calendar_url } : {}
    }));
    const [testimonialRows] = await connection.query("SELECT * FROM crew_testimonials ORDER BY sort_order");
    const crewTestimonials = testimonialRows.map((row) => ({ id: row.id, name: row.name, role: row.role, department: row.department, vesselOrCompany: row.vessel_or_company, rating: Number(row.rating), quote: row.quote, placedYear: row.placed_year, locationOrFlag: row.location_or_flag, verifiedStatus: row.verified_status, avatarInitials: row.avatar_initials }));
    const [slideRows] = await connection.query("SELECT * FROM hero_slides ORDER BY sort_order");
    const [tickerRows] = await connection.query("SELECT * FROM homepage_ticker_items ORDER BY sort_order");
    const [projectRows] = await connection.query("SELECT * FROM campaign_projects ORDER BY sort_order");
    const [rewardRows] = await connection.query("SELECT * FROM referral_reward_tiers ORDER BY sort_order");
    const [brandRows] = await connection.query("SELECT * FROM site_brand_assets WHERE brand_id = 1 LIMIT 1");
    const [socialRows] = await connection.query("SELECT platform, url FROM site_social_links");
    const [translationRows] = await connection.query("SELECT language_code, translation_key, translation_value FROM site_translations ORDER BY language_code, translation_key");
    const translations = {};
    for (const row of translationRows) {
      translations[row.language_code] ||= {};
      if (row.translation_key.startsWith("siteCopy.")) {
        translations[row.language_code].siteCopy ||= {};
        translations[row.language_code].siteCopy[row.translation_key.slice("siteCopy.".length)] = row.translation_value;
      } else {
        translations[row.language_code][row.translation_key] = row.translation_value;
      }
    }
    const content = {
      divisions,
      jobPositions,
      fleetVessels,
      newsArticles,
      upcomingEvents,
      crewTestimonials,
      aboutPage: [],
      heroSlides: slideRows.map((row) => ({ src: row.image_src, tag: row.tag, title: row.title, desc: row.description })),
      homepageTicker: tickerRows.map((row) => ({ text: row.item_text, time: row.display_time })),
      campaignProjects: projectRows.map((row) => ({ title: row.title, tag: row.tag, salary: row.salary, owner: row.owner, deadline: row.deadline, desc: row.description, route: row.route })),
      referralRewardTiers: rewardRows.map((row) => ({ rank: row.rank_name, roles: row.roles, reward: row.reward, highlight: Boolean(row.highlight), condition: row.condition_text })),
      brandAssets: brandRows.length > 0 ? {
        siteLogoUrl: brandRows[0].site_logo_url,
        siteLogoDarkUrl: brandRows[0].site_logo_dark_url,
        emblemUrl: brandRows[0].emblem_url,
        emblemDarkUrl: brandRows[0].emblem_dark_url,
        adminLoginLogoUrl: brandRows[0].admin_login_logo_url,
        faviconUrl: brandRows[0].favicon_url || "/favicon.png"
      } : {},
      socialLinks: Object.fromEntries(socialRows.map((row) => [row.platform, row.url])),
      translations
    };
    const [aboutRows] = await connection.execute(
      "SELECT content_json FROM site_content WHERE content_key = ? LIMIT 1",
      ["aboutPage"]
    );
    const aboutRow = aboutRows[0];
    if (aboutRow) content.aboutPage = parseLegacyContent(aboutRow.content_json);
    const [localizationRows] = await connection.query(
      "SELECT content_key, record_index, language_code, field_path, translated_text FROM site_content_localizations ORDER BY content_key, record_index, language_code, field_path"
    );
    for (const row of localizationRows) {
      const records = content[row.content_key];
      const record = Array.isArray(records) ? records[Number(row.record_index)] : void 0;
      if (!record || typeof record !== "object") continue;
      record._translations ||= {};
      record._translations[row.language_code] ||= {};
      record._translations[row.language_code][row.field_path] = row.translated_text;
    }
    return content;
  } finally {
    connection.release();
  }
}
async function saveSiteContent(key, value) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await replaceSiteContentOnConnection(connection, key, value);
    await replaceSiteContentLocalizations(connection, key, value);
    const recordCount = Array.isArray(value) ? value.length : Object.values(value).length;
    await connection.execute(
      "INSERT INTO cms_content_audit (content_key, record_count) VALUES (?, ?)",
      [key, recordCount]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function saveSiteMediaAsset(asset) {
  await pool.execute(
    `INSERT INTO site_media_assets (
      id, original_filename, storage_filename, file_url, mime_type, profile,
      compression_mode, original_width, original_height, original_size_bytes,
      output_width, output_height, output_size_bytes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset.id,
      asset.originalFilename,
      asset.storageFilename,
      asset.fileUrl,
      asset.mimeType,
      asset.profile,
      asset.compressionMode,
      asset.originalWidth,
      asset.originalHeight,
      asset.originalSizeBytes,
      asset.outputWidth,
      asset.outputHeight,
      asset.outputSizeBytes
    ]
  );
}
async function saveApplication(record) {
  const submittedAt = new Date(record.submittedAt || Date.now()).toISOString().slice(0, 19).replace("T", " ");
  const values = [
    record.id,
    record.pin,
    record.fullName,
    record.phone,
    record.email,
    record.positionTitle,
    record.divisionId,
    record.cvFileName || null,
    record.cvFileSize || null,
    record.cvFilePath || null,
    Number(record.experienceYears || 0),
    record.languageLevel || null,
    submittedAt,
    record.status || "\u0110\xE3 ti\u1EBFp nh\u1EADn",
    Number(record.statusProgress || 0),
    record.notes || "",
    record.assignedOfficer || "",
    record.departmentEmail || ""
  ];
  await pool.execute(
    `
      INSERT INTO applications (
        id, pin, full_name, phone, email, position_title, division_id,
        cv_file_name, cv_file_size, cv_file_path, experience_years, language_level,
        submitted_at, status, status_progress, notes, assigned_officer, department_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        pin = VALUES(pin),
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        email = VALUES(email),
        position_title = VALUES(position_title),
        division_id = VALUES(division_id),
        cv_file_name = VALUES(cv_file_name),
        cv_file_size = VALUES(cv_file_size),
        cv_file_path = VALUES(cv_file_path),
        experience_years = VALUES(experience_years),
        language_level = VALUES(language_level),
        submitted_at = VALUES(submitted_at),
        status = VALUES(status),
        status_progress = VALUES(status_progress),
        notes = VALUES(notes),
        assigned_officer = VALUES(assigned_officer),
        department_email = VALUES(department_email)
    `,
    values
  );
  return record;
}
async function listApplications() {
  const [rows] = await pool.query("SELECT * FROM applications ORDER BY created_at DESC");
  return rows.map(mapApplicationRow);
}
async function findApplicationById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM applications WHERE id = ? LIMIT 1",
    [id]
  );
  const result = rows[0];
  return result ? mapApplicationRow(result) : null;
}
async function updateApplicationStatus(id, status, statusProgress) {
  await pool.execute(
    "UPDATE applications SET status = ?, status_progress = ? WHERE id = ?",
    [status, statusProgress, id]
  );
}
async function findApplicationByIdAndPin(id, pin) {
  const [rows] = await pool.execute(
    "SELECT * FROM applications WHERE id = ? AND pin = ? LIMIT 1",
    [id, pin]
  );
  const result = rows[0];
  return result ? mapApplicationRow(result) : null;
}
async function saveContactMessage(payload) {
  const { name, phone, email, subject, message } = payload;
  const [result] = await pool.execute(
    "INSERT INTO contact_messages (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)",
    [name, phone, email, subject || "", message || ""]
  );
  return { id: Number(result.insertId) };
}
async function saveReferral(payload) {
  const {
    referrerName,
    referrerPhone,
    referrerRank,
    candidateName,
    candidatePhone,
    candidateRole,
    candidateNotes,
    trackingCode
  } = payload;
  const [result] = await pool.execute(
    `INSERT INTO referral_records
      (referrer_name, candidate_name, phone, email, position_title, note, referrer_phone, referrer_rank, candidate_phone, candidate_role, candidate_notes, tracking_code)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [referrerName, candidateName, referrerPhone, candidateRole || "", candidateNotes || "", referrerPhone, referrerRank || "", candidatePhone, candidateRole || "", candidateNotes || "", trackingCode]
  );
  return { id: Number(result.insertId), trackingCode };
}
async function saveEventRegistration(payload) {
  const { eventId, eventName, fullName, email, phone, note, ticketCode, eventDate, eventTime, location, attendanceMode, currentRole, question } = payload;
  await pool.execute(
    `INSERT INTO event_registrations
      (event_name, full_name, email, phone, note, event_id, ticket_code, event_date, event_time, location, attendance_mode, participant_role, question)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [eventName, fullName, email, phone, note || "", eventId || null, ticketCode, eventDate || "", eventTime || "", location || "", attendanceMode || "", currentRole || "", question || ""]
  );
  return { ticketCode };
}
async function listContactMessages() {
  const [rows] = await pool.query("SELECT id, name, phone, email, subject, message, created_at AS createdAt FROM contact_messages ORDER BY created_at DESC LIMIT 1000");
  return rows;
}
function mapReferralRow(row) {
  return {
    id: Number(row.id),
    trackingCode: row.tracking_code || `REF-ALCM-${String(row.id).padStart(6, "0")}`,
    referrerName: row.referrer_name,
    referrerPhone: row.referrer_phone || row.phone,
    referrerRank: row.referrer_rank || "",
    candidateName: row.candidate_name,
    candidatePhone: row.candidate_phone || "",
    candidateRole: row.candidate_role || row.position_title || "",
    candidateNotes: row.candidate_notes || row.note || "",
    createdAt: row.created_at
  };
}
async function listReferrals() {
  const [rows] = await pool.query("SELECT * FROM referral_records ORDER BY created_at DESC LIMIT 1000");
  return rows.map(mapReferralRow);
}
async function findReferralByTrackingCode(trackingCode) {
  const [rows] = await pool.execute("SELECT * FROM referral_records WHERE tracking_code = ? LIMIT 1", [trackingCode]);
  const row = rows[0];
  return row ? mapReferralRow(row) : null;
}
function mapEventRegistration(row) {
  return {
    id: Number(row.id),
    eventId: row.event_id || "",
    ticketCode: row.ticket_code || `ALCM-EVT-${String(row.id).padStart(6, "0")}`,
    eventName: row.event_name,
    eventDate: row.event_date || "",
    eventTime: row.event_time || "",
    location: row.location || "",
    attendanceMode: row.attendance_mode || "",
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    currentRole: row.participant_role || row.current_role || "",
    question: row.question || "",
    note: row.note || "",
    createdAt: row.created_at
  };
}
async function listEventRegistrations() {
  const [rows] = await pool.query("SELECT * FROM event_registrations ORDER BY created_at DESC LIMIT 1000");
  return rows.map(mapEventRegistration);
}
async function findEventRegistrationsByContact(phone, email) {
  const [rows] = await pool.execute(
    "SELECT * FROM event_registrations WHERE phone = ? AND LOWER(email) = LOWER(?) ORDER BY created_at DESC",
    [phone, email]
  );
  return rows.map(mapEventRegistration);
}

// src/contexts/LanguageContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

// src/data/siteContentEvents.ts
var SITE_CONTENT_REFRESHED_EVENT = "alcm:site-content-refreshed";
var SITE_CONTENT_LANGUAGE_EVENT = "alcm:site-content-language-change";

// src/contexts/LanguageContext.tsx
import { jsx } from "react/jsx-runtime";
var TRANSLATIONS = {
  vi: {
    about_alcm: "V\u1EC1 ALCM",
    about_alcm_desc: "H\u1ED3 s\u01A1 n\u0103ng l\u1EF1c, gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng & ban l\xE3nh \u0111\u1EA1o \xC2u L\u1EA1c Crew Manning",
    news: "Tin t\u1EE9c",
    news_desc: "C\u1EADp nh\u1EADt tin t\u1EE9c th\u1ECB tr\u01B0\u1EDDng h\xE0ng h\u1EA3i, vi\u1EC7c l\xE0m v\xE0 \u0111\xE0o t\u1EA1o",
    social_media: "M\u1EA1ng x\xE3 h\u1ED9i:",
    hotline: "Hotline:",
    track_application: "Tra c\u1EE9u h\u1ED3 s\u01A1",
    track_application_desc: "Tra c\u1EE9u ti\u1EBFn \u0111\u1ED9 h\u1ED3 s\u01A1 an to\xE0n b\u1EB1ng m\xE3 h\u1ED3 s\u01A1 v\xE0 m\xE3 PIN",
    mlc_certified: "Chu\u1EA9n MLC 2006",
    select_language: "Ch\u1ECDn ng\xF4n ng\u1EEF",
    nav_div1: "Xu\u1EA5t kh\u1EA9u ngu\u1ED3n l\u1EF1c",
    nav_div1_full: "Kh\u1ED1i xu\u1EA5t kh\u1EA9u ngu\u1ED3n l\u1EF1c",
    nav_div1_desc: "Cung \u1EE9ng nh\xE2n l\u1EF1c k\u1EF9 s\u01B0, k\u1EF9 thu\u1EADt vi\xEAn, \u0111i\u1EC1u d\u01B0\u1EE1ng sang Nh\u1EADt B\u1EA3n, H\xE0n Qu\u1ED1c, \u0110\xE0i Loan & Ch\xE2u \xC2u",
    nav_div2: "D\u1ECBch v\u1EE5 Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    nav_div2_full: "Kh\u1ED1i D\u1ECBch v\u1EE5 ngo\xE0i kh\u01A1i v\xE0 thuy\u1EC1n vi\xEAn",
    nav_div2_desc: "Cung \u1EE9ng s\u0129 quan, thuy\u1EC1n vi\xEAn qu\u1ED1c t\u1EBF v\xE0 d\u1ECBch v\u1EE5 k\u1EF9 thu\u1EADt d\u1EA7u kh\xED ngo\xE0i kh\u01A1i",
    nav_div3: "\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    nav_div3_full: "Kh\u1ED1i \u0111\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    nav_div3_desc: "Hu\u1EA5n luy\u1EC7n ch\u1EE9ng ch\u1EC9 STCW, \u0111\xE0o t\u1EA1o ngo\u1EA1i ng\u1EEF chuy\xEAn ng\xE0nh v\xE0 n\xE2ng h\u1EA1ng s\u0129 quan",
    nav_div4: "T\u01B0 v\u1EA5n du h\u1ECDc",
    nav_div4_full: "Trung t\xE2m t\u01B0 v\u1EA5n du h\u1ECDc \xC2u L\u1EA1c",
    nav_div4_desc: "T\u01B0 v\u1EA5n du h\u1ECDc ngh\u1EC1, \u0111\u1EA1i h\u1ECDc t\u1EA1i \u0110\u1EE9c, Nh\u1EADt, H\xE0n, \xDAc v\xE0 h\u1ECDc b\u1ED5ng qu\u1ED1c t\u1EBF",
    nav_campaigns: "D\u1EF1 \xE1n & Th\u01B0\u1EDFng gi\u1EDBi thi\u1EC7u",
    nav_campaigns_desc: "Gi\u1EDBi thi\u1EC7u \u1EE9ng vi\xEAn nh\u1EADn th\u01B0\u1EDFng ngay 2 - 15 tri\u1EC7u VN\u0110/\u1EE9ng vi\xEAn",
    bonus_badge: "Th\u01B0\u1EDFng 2 - 15tr",
    campaigns_subtitle: "C\u01A1 ch\u1EBF hoa h\u1ED3ng minh b\u1EA1ch - Nh\u1EADn th\u01B0\u1EDFng ngay sau khi xu\u1EA5t c\u1EA3nh",
    apply_now: "\u1EE8ng tuy\u1EC3n ngay",
    submit_cv: "G\u1EEDi CV / \u0110\u0103ng k\xFD",
    contact_us: "Li\xEAn h\u1EC7 t\u01B0 v\u1EA5n",
    explore_more: "Xem chi ti\u1EBFt",
    close: "\u0110\xF3ng",
    search_placeholder: "T\xECm ki\u1EBFm v\u1ECB tr\xED tuy\u1EC3n d\u1EE5ng, \u0111\u01A1n h\xE0ng xu\u1EA5t kh\u1EA9u, kho\xE1 h\u1ECDc...",
    brand_title: "\xC2u L\u1EA1c Crew Manning",
    brand_subtitle: "Cung \u1EE9ng Thuy\u1EC1n vi\xEAn & XKL\u0110 Qu\u1ED1c t\u1EBF",
    brand_tagline: "K\u1EBFt n\u1ED1i ngu\u1ED3n nh\xE2n l\u1EF1c Vi\u1EC7t Nam v\u01B0\u01A1n t\u1EA7m th\u1EBF gi\u1EDBi",
    live_update: "C\u1EADp nh\u1EADt m\u1EDBi",
    security_guarantee: "B\u1EA3o m\u1EADt h\u1ED3 s\u01A1 theo chu\u1EA9n qu\u1ED1c t\u1EBF",
    verified_company: "Doanh nghi\u1EC7p uy t\xEDn \u0111\u01B0\u1EE3c B\u1ED9 GTVT & B\u1ED9 L\u0110TBXH c\u1EA5p ph\xE9p",
    copyright: "B\u1EA3n quy\u1EC1n \xA9 2026 thu\u1ED9c v\u1EC1 C\xF4ng ty C\u1ED5 ph\u1EA7n \xC2u L\u1EA1c Crew Manning.",
    all_rights_reserved: "\u0110\xE3 \u0111\u0103ng k\xFD b\u1EA3n quy\u1EC1n. Gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng d\u1ECBch v\u1EE5 \u0111\u01B0a ng\u01B0\u1EDDi lao \u0111\u1ED9ng \u0111i l\xE0m vi\u1EC7c \u1EDF n\u01B0\u1EDBc ngo\xE0i.",
    language_name: "Ti\u1EBFng Vi\u1EC7t"
  },
  en: {
    about_alcm: "About ALCM",
    about_alcm_desc: "Company profile, official licenses & leadership of Au Lac Crew Manning",
    news: "News",
    news_desc: "Maritime market updates, job vacancies and professional training news",
    social_media: "Social Channels:",
    hotline: "Hotline:",
    track_application: "Track Application",
    track_application_desc: "Track recruitment progress safely using Application ID & PIN",
    mlc_certified: "MLC 2006 Certified",
    select_language: "Select Language",
    nav_div1: "Overseas Human Resources",
    nav_div1_full: "Division of Human Resource Export",
    nav_div1_desc: "Engineers, skilled technicians and healthcare specialists to Japan, Korea, Taiwan & Europe",
    nav_div2: "Offshore Services & Crew Manning",
    nav_div2_full: "Offshore Services & Crew Manning Division",
    nav_div2_desc: "Supplying certified maritime officers, crew members and offshore oil & gas technical teams",
    nav_div3: "Maritime Training & Education",
    nav_div3_full: "Training & Maritime Education Division",
    nav_div3_desc: "STCW safety certification, professional maritime English, rank upgrades & simulator training",
    nav_div4: "Study Abroad Center",
    nav_div4_full: "Au Lac Study Abroad Advisory Center",
    nav_div4_desc: "Vocational and university study pathways in Germany, Japan, Korea, Australia & scholarships",
    nav_campaigns: "Projects & Referral Rewards",
    nav_campaigns_desc: "Refer qualified candidates and receive cash bonuses from $100 to $700 per person",
    bonus_badge: "Bonus $100-$700",
    campaigns_subtitle: "Transparent referral program - Immediate payout upon successful embarkation",
    apply_now: "Apply Now",
    submit_cv: "Submit CV / Apply",
    contact_us: "Contact Us",
    explore_more: "Learn More",
    close: "Close",
    search_placeholder: "Search job vacancies, overseas opportunities, courses...",
    brand_title: "Au Lac Crew Manning",
    brand_subtitle: "Crew Manning & Global Human Resources",
    brand_tagline: "Connecting Vietnamese talent with premier global opportunities",
    live_update: "Live Updates",
    security_guarantee: "Data security aligned with international maritime standards",
    verified_company: "Licensed by Ministry of Transport and Ministry of Labour, Invalids and Social Affairs",
    copyright: "Copyright \xA9 2026 Au Lac Crew Manning Joint Stock Company.",
    all_rights_reserved: "All rights reserved. Official overseas manpower and crew management license.",
    language_name: "English"
  },
  ja: {
    about_alcm: "ALCM\u306B\u3064\u3044\u3066",
    about_alcm_desc: "\u30AA\u30A6\u30E9\u30C3\u30AF\u30FB\u30AF\u30EB\u30FC\u30FB\u30DE\u30CB\u30F3\u30B0\u4F1A\u793E\u6982\u8981\u3001\u8A8D\u53EF\u8A3C\u304A\u3088\u3073\u7D44\u7E54\u60C5\u5831",
    news: "\u30CB\u30E5\u30FC\u30B9",
    news_desc: "\u6D77\u4E8B\u5E02\u5834\u52D5\u5411\u3001\u6C42\u4EBA\u52DF\u96C6\u60C5\u5831\u3001\u5404\u7A2E\u7814\u4FEE\u30FB\u30BB\u30DF\u30CA\u30FC\u306E\u304A\u77E5\u3089\u305B",
    social_media: "\u516C\u5F0FSNS:",
    hotline: "\u30DB\u30C3\u30C8\u30E9\u30A4\u30F3:",
    track_application: "\u5FDC\u52DF\u66F8\u985E\u7167\u4F1A",
    track_application_desc: "\u5FDC\u52DF\u756A\u53F7\u3068\u6697\u8A3C\u756A\u53F7(PIN)\u3067\u9032\u6357\u72B6\u6CC1\u3092\u5B89\u5168\u306B\u7167\u4F1A",
    mlc_certified: "MLC 2006\u8A8D\u8A3C\u53D6\u5F97",
    select_language: "\u8A00\u8A9E\u3092\u9078\u629E",
    nav_div1: "\u6D77\u5916\u4EBA\u6750\u6D3E\u9063",
    nav_div1_full: "\u4EBA\u6750\u6D3E\u9063\u30FB\u6D77\u5916\u5C31\u52B4\u4E8B\u696D\u672C\u90E8",
    nav_div1_desc: "\u65E5\u672C\u3001\u97D3\u56FD\u3001\u53F0\u6E7E\u3001\u6B27\u5DDE\u5411\u3051\u30A8\u30F3\u30B8\u30CB\u30A2\u3001\u7279\u5B9A\u6280\u80FD\u3001\u4ECB\u8B77\u6280\u8853\u8005\u306E\u6D3E\u9063",
    nav_div2: "\u6D77\u6D0B\u30B5\u30FC\u30D3\u30B9\u30FB\u8239\u54E1\u6D3E\u9063",
    nav_div2_full: "\u6D77\u6D0B\u958B\u767A\u304A\u3088\u3073\u8239\u54E1\u4F9B\u7D66\u4E8B\u696D\u672C\u90E8",
    nav_div2_desc: "\u56FD\u969B\u822A\u8DEF\u5411\u3051\u6709\u8CC7\u683C\u8239\u54E1\u30FB\u58EB\u5B98\u304A\u3088\u3073\u6D77\u6D0B\u77F3\u6CB9\u30FB\u5929\u7136\u30AC\u30B9\u5411\u3051\u6280\u8853\u30B9\u30BF\u30C3\u30D5\u306E\u6D3E\u9063",
    nav_div3: "\u6D77\u4E8B\u6559\u80B2\u30FB\u8A13\u7DF4",
    nav_div3_full: "\u6D77\u4E8B\u6559\u80B2\u304A\u3088\u3073\u8A13\u7DF4\u4E8B\u696D\u672C\u90E8",
    nav_div3_desc: "STCW\u6761\u7D04\u5BFE\u5FDC\u5B89\u5168\u8A13\u7DF4\u3001\u6D77\u4E8B\u5C02\u9580\u82F1\u8A9E\u3001\u8077\u4F4D\u6607\u683C\u8A13\u7DF4\u304A\u3088\u3073\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC\u5B9F\u7FD2",
    nav_div4: "\u7559\u5B66\u76F8\u8AC7",
    nav_div4_full: "\u6B27\u697D\u7559\u5B66\u76F8\u8AC7\u30FB\u9032\u5B66\u652F\u63F4\u30BB\u30F3\u30BF\u30FC",
    nav_div4_desc: "\u30C9\u30A4\u30C4\u3001\u65E5\u672C\u3001\u97D3\u56FD\u3001\u30AA\u30FC\u30B9\u30C8\u30E9\u30EA\u30A2\u3078\u306E\u8077\u696D\u5C02\u9580\u30FB\u5927\u5B66\u7559\u5B66\u652F\u63F4\u304A\u3088\u3073\u5968\u5B66\u91D1\u5236\u5EA6",
    nav_campaigns: "\u63A1\u7528\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30FB\u7D39\u4ECB\u5831\u916C",
    nav_campaigns_desc: "\u512A\u79C0\u306A\u4EBA\u6750\u306E\u3054\u7D39\u4ECB\u3067200\u4E07\u301C1,500\u4E07VND\u306E\u7D39\u4ECB\u5831\u916C\u3092\u9032\u5448",
    bonus_badge: "\u7D39\u4ECB\u5831\u916C 2-15\u4E07",
    campaigns_subtitle: "\u660E\u6717\u306A\u5831\u916C\u30B7\u30B9\u30C6\u30E0\u30FB\u51FA\u56FD/\u4E57\u8239\u78BA\u8A8D\u5F8C\u306B\u8FC5\u901F\u652F\u6255\u3044",
    apply_now: "\u4ECA\u3059\u3050\u5FDC\u52DF",
    submit_cv: "\u5C65\u6B74\u66F8\u9001\u4ED8 / \u5FDC\u52DF",
    contact_us: "\u304A\u554F\u3044\u5408\u308F\u305B",
    explore_more: "\u8A73\u7D30\u3092\u898B\u308B",
    close: "\u9589\u3058\u308B",
    search_placeholder: "\u6C42\u4EBA\u30DD\u30B8\u30B7\u30E7\u30F3\u3001\u6D77\u5916\u6D3E\u9063\u6848\u4EF6\u3001\u8B1B\u7FD2\u3092\u691C\u7D22...",
    brand_title: "Au Lac Crew Manning",
    brand_subtitle: "\u56FD\u969B\u8239\u54E1\u6D3E\u9063\u30FB\u6D77\u5916\u5C31\u52B4\u30DE\u30CD\u30B8\u30E1\u30F3\u30C8",
    brand_tagline: "\u30D9\u30C8\u30CA\u30E0\u306E\u512A\u308C\u305F\u4EBA\u6750\u3092\u4E16\u754C\u306E\u30C8\u30C3\u30D7\u30D5\u30EA\u30FC\u30C8\u30FB\u4F01\u696D\u3078",
    live_update: "\u6700\u65B0\u901F\u5831",
    security_guarantee: "\u56FD\u969B\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u57FA\u6E96\u306B\u6E96\u62E0\u3057\u305F\u53B3\u683C\u306A\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77",
    verified_company: "\u30D9\u30C8\u30CA\u30E0\u4EA4\u901A\u904B\u8F38\u7701\u304A\u3088\u3073\u52B4\u50CD\u30FB\u50B7\u75C5\u5175\u30FB\u793E\u4F1A\u554F\u984C\u7701\u516C\u8A8D\u4F01\u696D",
    copyright: "Copyright \xA9 2026 Au Lac Crew Manning Joint Stock Company.",
    all_rights_reserved: "\u7121\u65AD\u8EE2\u8F09\u3092\u7981\u3058\u307E\u3059\u3002\u516C\u8A8D\u56FD\u969B\u8239\u54E1\u30FB\u52B4\u50CD\u8005\u6D3E\u9063\u4E8B\u696D\u8005\u3002",
    language_name: "\u65E5\u672C\u8A9E"
  },
  ko: {
    about_alcm: "ALCM \uC18C\uAC1C",
    about_alcm_desc: "\uC544\uC6B0\uB77D \uD06C\uB8E8 \uB9E4\uB2DD \uAE30\uC5C5 \uC18C\uAC1C, \uACF5\uC778 \uC778\uD5C8\uAC00\uC99D \uBC0F \uACBD\uC601\uC9C4 \uC815\uBCF4",
    news: "\uB274\uC2A4",
    news_desc: "\uD574\uC6B4 \uC2DC\uC7A5 \uB3D9\uD5A5, \uCC44\uC6A9 \uACF5\uACE0 \uBC0F \uC9C1\uBB34 \uD6C8\uB828 \uC18C\uC2DD",
    social_media: "\uC18C\uC15C \uBBF8\uB514\uC5B4:",
    hotline: "\uD56B\uB77C\uC778:",
    track_application: "\uC9C0\uC6D0 \uC870\uD68C",
    track_application_desc: "\uC9C0\uC6D0 \uC811\uC218\uBC88\uD638\uC640 PIN \uCF54\uB4DC\uB85C \uC804\uD615 \uC9C4\uD589 \uC0C1\uD0DC\uB97C \uC548\uC804\uD558\uAC8C \uD655\uC778",
    mlc_certified: "MLC 2006 \uACF5\uC2DD \uC778\uC99D",
    select_language: "\uC5B8\uC5B4 \uC120\uD0DD",
    nav_div1: "\uD574\uC678 \uC778\uB825 \uC1A1\uCD9C",
    nav_div1_full: "\uD574\uC678 \uC778\uB825 \uC1A1\uCD9C \uC0AC\uC5C5\uBCF8\uBD80",
    nav_div1_desc: "\uC77C\uBCF8, \uD55C\uAD6D, \uB300\uB9CC, \uC720\uB7FD\uC744 \uC704\uD55C \uC5D4\uC9C0\uB2C8\uC5B4, \uC804\uBB38 \uAE30\uC220 \uC778\uB825 \uBC0F \uAC04\uD638 \uC804\uBB38 \uC778\uB825",
    nav_div2: "\uD574\uC591 \uC11C\uBE44\uC2A4 \uBC0F \uC120\uC6D0 \uACF5\uAE09",
    nav_div2_full: "\uD574\uC591 \uD50C\uB79C\uD2B8 \uC11C\uBE44\uC2A4 \uBC0F \uC120\uC6D0 \uACF5\uAE09 \uBCF8\uBD80",
    nav_div2_desc: "\uAD6D\uC81C \uD56D\uB85C \uACF5\uC778 \uD574\uAE30\uC0AC \uBC0F \uBD80\uC6D0 \uC120\uC6D0, \uD574\uC591 \uC11D\uC720\xB7\uAC00\uC2A4 \uC804\uBB38 \uAE30\uC220 \uC778\uB825 \uACF5\uAE09",
    nav_div3: "\uD574\uC0AC \uAD50\uC721 \uBC0F \uD6C8\uB828",
    nav_div3_full: "\uD574\uC0AC \uAD50\uC721 \uBC0F \uC804\uBB38 \uD6C8\uB828 \uBCF8\uBD80",
    nav_div3_desc: "STCW \uC548\uC804 \uC778\uC99D \uD6C8\uB828, \uD574\uC0AC \uC804\uBB38 \uC5B4\uD559 \uAD50\uC721, \uBA74\uC7A5 \uC2B9\uAE09 \uBC0F \uC2DC\uBBAC\uB808\uC774\uD130 \uC2E4\uC2B5",
    nav_div4: "\uD574\uC678 \uC720\uD559 \uC0C1\uB2F4",
    nav_div4_full: "\uC544\uC6B0\uB77D \uD574\uC678 \uC720\uD559 \uCEE8\uC124\uD305 \uC13C\uD130",
    nav_div4_desc: "\uB3C5\uC77C, \uC77C\uBCF8, \uD55C\uAD6D, \uD638\uC8FC \uC9C1\uC5C5 \uAE30\uC220 \uC720\uD559 \uBC0F \uB300\uD559\uAD50 \uC9C4\uD559 \uCEE8\uC124\uD305, \uC7A5\uD559\uAE08 \uC9C0\uC6D0",
    nav_campaigns: "\uCC44\uC6A9 \uD504\uB85C\uC81D\uD2B8 \uBC0F \uCD94\uCC9C \uBCF4\uC0C1",
    nav_campaigns_desc: "\uC778\uC7AC \uCD94\uCC9C \uC2DC 1\uC778\uB2F9 200\uB9CC ~ 1,500\uB9CC \uB3D9(VND) \uB9AC\uC6CC\uB4DC \uBCF4\uC0C1 \uC9C0\uAE09",
    bonus_badge: "\uBCF4\uC0C1\uAE08 2-15\uBC31\uB9CC",
    campaigns_subtitle: "\uD22C\uBA85\uD55C \uCD94\uCC9C \uBCF4\uC0C1 \uC2DC\uC2A4\uD15C - \uCD9C\uAD6D \uBC0F \uC2B9\uC120 \uC644\uB8CC \uC2DC \uC989\uC2DC \uC9C0\uAE09",
    apply_now: "\uC9C0\uAE08 \uC9C0\uC6D0\uD558\uAE30",
    submit_cv: "\uC774\uB825\uC11C \uC81C\uCD9C / \uC9C0\uC6D0",
    contact_us: "\uC0C1\uB2F4 \uBB38\uC758",
    explore_more: "\uC0C1\uC138 \uBCF4\uAE30",
    close: "\uB2EB\uAE30",
    search_placeholder: "\uCC44\uC6A9 \uD3EC\uC9C0\uC158, \uD574\uC678 \uD30C\uACAC \uACF5\uACE0, \uAD50\uC721 \uACFC\uC815 \uAC80\uC0C9...",
    brand_title: "Au Lac Crew Manning",
    brand_subtitle: "\uC120\uC6D0 \uACF5\uAE09 \uBC0F \uAE00\uB85C\uBC8C \uC778\uC7AC \uB9E4\uB2C8\uC9C0\uBA3C\uD2B8",
    brand_tagline: "\uBCA0\uD2B8\uB0A8\uC758 \uC6B0\uC218\uD55C \uC778\uC7AC\uB97C \uAE00\uB85C\uBC8C \uD574\uC6B4 \uBC0F \uC0B0\uC5C5 \uD604\uC7A5\uC73C\uB85C",
    live_update: "\uC2E4\uC2DC\uAC04 \uD604\uD669",
    security_guarantee: "\uAD6D\uC81C \uD45C\uC900\uC5D0 \uB530\uB978 \uCCA0\uC800\uD55C \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638",
    verified_company: "\uBCA0\uD2B8\uB0A8 \uAD50\uD1B5\uBD80 \uBC0F \uB178\uB3D9\uBCF4\uD6C8\uC0AC\uD68C\uBD80 \uACF5\uC2DD \uD5C8\uAC00 \uAE30\uC5C5",
    copyright: "Copyright \xA9 2026 Au Lac Crew Manning \uC8FC\uC2DD\uD68C\uC0AC.",
    all_rights_reserved: "\uD310\uAD8C \uC18C\uC720. \uC815\uBD80 \uACF5\uC778 \uAD6D\uC81C \uC120\uC6D0 \uBC0F \uD574\uC678 \uC778\uB825 \uC1A1\uCD9C \uAE30\uC5C5.",
    language_name: "\uD55C\uAD6D\uC5B4"
  },
  zh: {
    about_alcm: "\u5173\u4E8EALCM",
    about_alcm_desc: "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u80A1\u4EFD\u6709\u9650\u516C\u53F8\u6982\u51B5\u3001\u5B98\u65B9\u8D44\u8D28\u724C\u7167\u4E0E\u7BA1\u7406\u56E2\u961F",
    news: "\u65B0\u95FB\u52A8\u6001",
    news_desc: "\u6D77\u8FD0\u822A\u8FD0\u5E02\u573A\u52A8\u6001\u3001\u6700\u65B0\u62DB\u8058\u5C97\u4F4D\u4E0E\u4E13\u4E1A\u57F9\u8BAD\u901A\u77E5",
    social_media: "\u793E\u4EA4\u5E73\u53F0:",
    hotline: "\u670D\u52A1\u70ED\u7EBF:",
    track_application: "\u6863\u6848\u8FDB\u5EA6\u67E5\u8BE2",
    track_application_desc: "\u4F7F\u7528\u5E94\u8058\u7F16\u53F7\u548CPIN\u7801\u5B89\u5168\u67E5\u8BE2\u62DB\u8058\u529E\u7406\u4E0E\u5BA1\u6838\u8FDB\u5EA6",
    mlc_certified: "MLC 2006 \u56FD\u9645\u6D77\u4E8B\u8BA4\u8BC1",
    select_language: "\u9009\u62E9\u8BED\u8A00",
    nav_div1: "\u4EBA\u529B\u8D44\u6E90\u5916\u6D3E",
    nav_div1_full: "\u4EBA\u529B\u8D44\u6E90\u5916\u6D3E\u4E8B\u4E1A\u90E8",
    nav_div1_desc: "\u5411\u65E5\u672C\u3001\u97E9\u56FD\u3001\u53F0\u6E7E\u53CA\u6B27\u6D32\u8F93\u9001\u9AD8\u6280\u80FD\u5DE5\u7A0B\u5E08\u3001\u7CBE\u5BC6\u6280\u672F\u4EBA\u5458\u53CA\u533B\u62A4\u4EBA\u624D",
    nav_div2: "\u6D77\u6D0B\u5DE5\u7A0B\u670D\u52A1\u4E0E\u8239\u5458\u6D3E\u9063",
    nav_div2_full: "\u6D77\u6D0B\u5DE5\u7A0B\u670D\u52A1\u4E0E\u8239\u5458\u6D3E\u9063\u4E8B\u4E1A\u90E8",
    nav_div2_desc: "\u4E3A\u56FD\u9645\u8FDC\u6D0B\u8239\u4E1C\u63D0\u4F9B\u5408\u683C\u6D77\u5458\u3001\u9AD8\u7EA7\u8239\u957F\u8F6E\u673A\u957F\u53CA\u6D77\u6D0B\u77F3\u6CB9\u6280\u672F\u4EBA\u5458",
    nav_div3: "\u57F9\u8BAD\u4E0E\u6D77\u4E8B\u6559\u80B2",
    nav_div3_full: "\u57F9\u8BAD\u4E0E\u6D77\u4E8B\u6559\u80B2\u4E8B\u4E1A\u90E8",
    nav_div3_desc: "STCW\u516C\u7EA6\u56FD\u9645\u5B89\u5168\u8BA4\u8BC1\u3001\u4E13\u4E1A\u6D77\u4E8B\u82F1\u8BED\u3001\u804C\u52A1\u664B\u5347\u4E0E\u6A21\u62DF\u5668\u5B9E\u8BAD",
    nav_div4: "\u7559\u5B66\u54A8\u8BE2",
    nav_div4_full: "\u6B27\u4E50\u7559\u5B66\u4E0E\u51FA\u56FD\u8FDB\u4FEE\u54A8\u8BE2\u4E2D\u5FC3",
    nav_div4_desc: "\u5FB7\u56FD\u53CC\u5143\u5236\u804C\u4E1A\u6559\u80B2\u3001\u65E5\u672C\u3001\u97E9\u56FD\u3001\u6FB3\u6D32\u9AD8\u6821\u7559\u5B66\u54A8\u8BE2\u4E0E\u5168\u989D\u5956\u5B66\u91D1\u6307\u5BFC",
    nav_campaigns: "\u62DB\u8058\u9879\u76EE\u4E0E\u63A8\u8350\u5956\u52B1",
    nav_campaigns_desc: "\u63A8\u8350\u4F18\u79C0\u6C42\u804C\u8005\uFF0C\u6BCF\u4F4D\u6700\u9AD8\u53EF\u83B7200\u4E07\u81F31500\u4E07\u8D8A\u5357\u76FE\u73B0\u91D1\u5956\u52B1",
    bonus_badge: "\u63A8\u8350\u5956\u52B1 2-15M",
    campaigns_subtitle: "\u900F\u660E\u900F\u660E\u7684\u63A8\u8350\u5956\u52B1\u673A\u5236 - \u51FA\u56FD\u6216\u767B\u8239\u786E\u8BA4\u540E\u7ACB\u5373\u7ED3\u7B97",
    apply_now: "\u7ACB\u5373\u5E94\u8058",
    submit_cv: "\u63D0\u4EA4\u7B80\u5386 / \u62A5\u540D",
    contact_us: "\u5728\u7EBF\u54A8\u8BE2",
    explore_more: "\u67E5\u770B\u8BE6\u60C5",
    close: "\u5173\u95ED",
    search_placeholder: "\u641C\u7D22\u62DB\u8058\u5C97\u4F4D\u3001\u5916\u6D3E\u8BA2\u5355\u3001\u4E13\u4E1A\u57F9\u8BAD\u8BFE\u7A0B...",
    brand_title: "\u6B27\u4E50\u8239\u5458\u7BA1\u7406",
    brand_subtitle: "\u56FD\u9645\u6D77\u5458\u6D3E\u9063\u4E0E\u5168\u7403\u4EBA\u529B\u8D44\u6E90\u5916\u6D3E",
    brand_tagline: "\u643A\u624B\u5353\u8D8A\u8D8A\u5357\u4EBA\u624D\uFF0C\u626C\u5E06\u8FDE\u63A5\u5168\u7403\u673A\u9047",
    live_update: "\u6700\u65B0\u52A8\u6001",
    security_guarantee: "\u4E25\u683C\u7B26\u5408\u56FD\u9645\u6D77\u4E8B\u4FE1\u606F\u5B89\u5168\u4E0E\u9690\u79C1\u4FDD\u969C\u4F53\u7CFB",
    verified_company: "\u8D8A\u5357\u4EA4\u901A\u8FD0\u8F93\u90E8\u4E0E\u52B3\u52A8\u4F24\u6B8B\u519B\u4EBA\u53CA\u793E\u4F1A\u90E8\u53CC\u91CD\u6838\u51C6\u4F01\u4E1A",
    copyright: "\u7248\u6743\u6240\u6709 \xA9 2026 \u6B27\u4E50\u8239\u5458\u7BA1\u7406\u80A1\u4EFD\u6709\u9650\u516C\u53F8\u3002",
    all_rights_reserved: "\u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u62E5\u6709\u5B98\u65B9\u5BF9\u5916\u52B3\u52A1\u5408\u4F5C\u4E0E\u56FD\u9645\u8239\u5458\u5916\u6D3E\u8D44\u8D28\u3002",
    language_name: "\u4E2D\u6587 (\u7B80\u4F53)"
  }
};
var ROUTE_UI_COPY_DEFAULTS = {
  "home.coreAreas.apply": "N\u1ED9p h\u1ED3 s\u01A1",
  "home.coreAreas.viewPage": "Xem th\xEAm",
  "page.labour.eyebrow": "Kh\u1ED1i 03 Tr\u1EF1c thu\u1ED9c T\u1ED5ng Gi\xE1m \u0110\u1ED1c ALCM",
  "page.labour.applyCta": "N\u1ED9p h\u1ED3 s\u01A1 \u1EE9ng tuy\u1EC3n Kh\u1ED1i 03",
  "page.labour.viewOpenings": "Xem \u0111\u01A1n h\xE0ng \u0111ang tuy\u1EC3n",
  "page.labour.marketsDescription": "C\xE1c ch\u01B0\u01A1ng tr\xECnh xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng v\xE0 h\u1EE3p t\xE1c qu\u1ED1c t\u1EBF c\xF3 m\u1EE9c thu nh\u1EADp minh b\u1EA1ch, quy\u1EC1n l\u1EE3i b\u1EA3o \u0111\u1EA3m v\xE0 \u0111\u1ED1i t\xE1c ti\u1EBFp nh\u1EADn uy t\xEDn.",
  "page.labour.market.jp.country": "Nh\u1EADt B\u1EA3n (Japan)",
  "page.labour.market.de.country": "CHLB \u0110\u1EE9c (Germany)",
  "page.labour.market.kr.country": "H\xE0n Qu\u1ED1c (South Korea)",
  "page.labour.market.global.country": "Chuy\xEAn gia n\u01B0\u1EDBc ngo\xE0i t\u1EA1i Vi\u1EC7t Nam",
  "page.labour.incomeLabel": "M\u1EE9c thu nh\u1EADp d\u1EF1 ki\u1EBFn:",
  "page.labour.rolesLabel": "Ng\xE0nh ngh\u1EC1 tuy\u1EC3n d\u1EE5ng ch\u1EE7 y\u1EBFu:",
  "page.labour.benefitsLabel": "Ch\xEDnh s\xE1ch & Quy\u1EC1n l\u1EE3i:",
  "page.labour.feeNote": "Ph\xED d\u1ECBch v\u1EE5 theo quy \u0111\u1ECBnh B\u1ED9 L\u0110-TB&XH",
  "page.labour.applyMarket": "\u0110\u0103ng k\xFD th\u1ECB tr\u01B0\u1EDDng n\xE0y",
  "page.labour.openOrders": "{count} \u0111\u01A1n h\xE0ng \u0111ang tuy\u1EC3n",
  "page.labour.openingsDescription": "C\xE1c v\u1ECB tr\xED tuy\u1EC3n tr\u1EF1c ti\u1EBFp t\u1EEB nghi\u1EC7p \u0111o\xE0n, doanh nghi\u1EC7p ti\u1EBFp nh\u1EADn qu\u1ED1c t\u1EBF",
  "page.labour.quota": "S\u1ED1 l\u01B0\u1EE3ng:",
  "page.labour.people": "ng\u01B0\u1EDDi",
  "page.labour.deadline": "H\u1EA1n n\u1ED9p:",
  "page.labour.salaryLabel": "M\u1EE9c l\u01B0\u01A1ng:",
  "page.labour.applyJob": "\u1EE8ng tuy\u1EC3n ngay",
  "page.labour.licenseBadge": "MLC & Gi\u1EA5y ph\xE9p XKL\u0110",
  "page.labour.consultTitle": "C\u1EA7n t\u01B0 v\u1EA5n tr\u1EF1c ti\u1EBFp v\u1EC1 th\u1EE7 t\u1EE5c xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng?",
  "page.labour.consultCta": "\u0110\u0103ng k\xFD t\u01B0 v\u1EA5n mi\u1EC5n ph\xED",
  "page.labour.safeguard.costTitle": "Chi ph\xED minh b\u1EA1ch 100%",
  "page.labour.safeguard.costDescription": "Cam k\u1EBFt kh\xF4ng ph\xE1t sinh ph\u1EE5 ph\xED \u1EA9n, b\u1EA3ng chi ph\xED c\xF4ng khai theo bi\u1EC3u ph\xED c\u1EE7a C\u1EE5c Qu\u1EA3n l\xFD Lao \u0111\u1ED9ng Ngo\xE0i n\u01B0\u1EDBc.",
  "page.labour.safeguard.supportTitle": "\u0110\u1ED3ng h\xE0nh su\u1ED1t th\u1EDDi h\u1EA1n h\u1EE3p \u0111\u1ED3ng",
  "page.labour.safeguard.supportDescription": "\u0110\u1EA1i di\u1EC7n ALCM t\u1EA1i Nh\u1EADt B\u1EA3n v\xE0 \u0110\u1EE9c t\xFAc tr\u1EF1c h\u1ED7 tr\u1EE3 kh\u1EA9n c\u1EA5p 24/7 v\u1EC1 nh\xE0 \u1EDF, y t\u1EBF, gia h\u1EA1n visa v\xE0 thanh l\xFD h\u1EE3p \u0111\u1ED3ng.",
  "page.labour.safeguard.returnTitle": "H\u1ED7 tr\u1EE3 t\xE1i h\xF2a nh\u1EADp khi v\u1EC1 n\u01B0\u1EDBc",
  "page.labour.safeguard.returnDescription": "Kh\u1ED1i 05 ph\u1ED1i h\u1EE3p k\u1EBFt n\u1ED1i vi\u1EC7c l\xE0m m\u1EDBi t\u1EA1i c\xE1c doanh nghi\u1EC7p FDI \u1EDF Vi\u1EC7t Nam sau khi ng\u01B0\u1EDDi lao \u0111\u1ED9ng ho\xE0n th\xE0nh h\u1EE3p \u0111\u1ED3ng.",
  "page.offshore.eyebrow": "Kh\u1ED1i 01 Tr\u1EF1c thu\u1ED9c T\u1ED5ng Gi\xE1m \u0110\u1ED1c ALCM",
  "page.offshore.applyCta": "N\u1ED9p h\u1ED3 s\u01A1 Thuy\u1EC1n vi\xEAn",
  "page.offshore.viewOpenings": "Ch\u1EE9c danh \u0111ang tuy\u1EC3n",
  "page.offshore.capabilitiesDescription": "H\u1EC7 th\u1ED1ng ph\xF2ng ban chuy\xEAn tr\xE1ch v\u1EADn h\xE0nh theo ti\xEAu chu\u1EA9n qu\u1EA3n l\xFD ch\u1EA5t l\u01B0\u1EE3ng ISO 9001:2015 v\xE0 SRPS MLC 2006.",
  "page.offshore.fleetEyebrow": "\u0110\u1ED9i T\xE0u & \u0110\u1ED1i T\xE1c V\u1EADn H\xE0nh",
  "page.offshore.fleetDescription": "Thuy\u1EC1n vi\xEAn ALCM tr\u1EF1c ti\u1EBFp \u0111i\u1EC1u khi\u1EC3n v\xE0 v\u1EADn h\xE0nh c\xE1c t\xE0u ch\u1EDF d\u1EA7u s\u1EA3n ph\u1EA9m, h\xF3a ch\u1EA5t \u0111\u1EA1t chu\u1EA9n ki\u1EC3m tra nghi\xEAm ng\u1EB7t qu\u1ED1c t\u1EBF SIRE/CDI.",
  "page.offshore.openingsDescription": "L\xEAn t\xE0u ngay trong th\xE1ng, ch\u1EBF \u0111\u1ED9 \u0111\xE3i ng\u1ED9 c\u1EA1nh tranh, h\u1EE3p \u0111\u1ED3ng minh b\u1EA1ch chu\u1EA9n MLC 2006.",
  "page.offshore.openPositions": "v\u1ECB tr\xED \u0111ang tuy\u1EC3n",
  "page.offshore.people": "ng\u01B0\u1EDDi",
  "page.offshore.quota": "S\u1ED1 l\u01B0\u1EE3ng:",
  "page.offshore.deadline": "H\u1EA1n \u0111\xF3n t\xE0u:",
  "page.offshore.salary": "M\u1EE9c l\u01B0\u01A1ng:",
  "page.offshore.standard": "Chu\u1EA9n STCW & MLC",
  "page.offshore.applyJob": "\u1EE8ng tuy\u1EC3n v\u1ECB tr\xED",
  "page.offshore.contactTitle": "B\u1ED9 ph\u1EADn tuy\u1EC3n d\u1EE5ng Thuy\u1EC1n vi\xEAn ALCM",
  "page.offshore.contactCta": "G\u1EEDi h\u1ED3 s\u01A1 thuy\u1EC1n vi\xEAn tr\u1EF1c tuy\u1EBFn",
  "page.offshore.contactHotline": "Hotline thuy\u1EC1n vi\xEAn:",
  "page.training.eyebrow": "Kh\u1ED1i 02 Tr\u1EF1c thu\u1ED9c T\u1ED5ng Gi\xE1m \u0110\u1ED1c ALCM",
  "page.training.viewJourney": "Xem Quy tr\xECnh 5 b\u01B0\u1EDBc tuy\u1EC3n ch\u1ECDn",
  "page.training.enrollCta": "\u0110\u0103ng k\xFD kh\xF3a hu\u1EA5n luy\u1EC7n",
  "page.training.journeyEyebrow": "Chu\u1EA9n H\xF3a Quy Tr\xECnh \u0110\xE0o T\u1EA1o & \u0110\u1ED3ng H\xE0nh",
  "page.training.centersDescription": "C\u01A1 s\u1EDF v\u1EADt ch\u1EA5t hi\u1EC7n \u0111\u1EA1i, gi\u1EA3ng vi\xEAn gi\xE0u kinh nghi\u1EC7m th\u1EF1c t\u1EBF v\xE0 h\u1EC7 th\u1ED1ng ki\u1EC3m \u0111\u1ECBnh n\u0103ng l\u1EF1c chu\u1EA9n h\xF3a qu\u1ED1c t\u1EBF.",
  "page.training.coreProgram": "N\u1ED9i dung \u0111\xE0o t\u1EA1o tr\u1ECDng t\xE2m:",
  "page.training.certification": "C\u1EA5p ch\u1EE9ng nh\u1EADn h\u1EE3p chu\u1EA9n",
  "page.training.enrollCenter": "\u0110\u0103ng k\xFD tham gia kh\xF3a n\xE0y",
  "page.training.admissions": "Ph\xF2ng Tuy\u1EC3n sinh & Hu\u1EA5n luy\u1EC7n nghi\u1EC7p v\u1EE5 ALCM",
  "page.training.consultCta": "\u0110\u0103ng k\xFD ki\u1EC3m tra tr\xECnh \u0111\u1ED9 & T\u01B0 v\u1EA5n",
  "page.training.contactHotline": "Hotline \u0111\xE0o t\u1EA1o:",
  "page.studyAbroad.eyebrow": "Kh\u1ED1i 04 Tr\u1EF1c thu\u1ED9c T\u1ED5ng Gi\xE1m \u0110\u1ED1c ALCM",
  "page.studyAbroad.country.de": "CHLB \u0110\u1EE9c (Germany)",
  "page.studyAbroad.country.jp": "Nh\u1EADt B\u1EA3n (Japan)",
  "page.studyAbroad.country.kr": "H\xE0n Qu\u1ED1c (South Korea)",
  "page.studyAbroad.consultCta": "\u0110\u0103ng k\xFD t\u01B0 v\u1EA5n l\u1ED9 tr\xECnh 1-1",
  "page.studyAbroad.viewPrograms": "C\xE1c ch\u01B0\u01A1ng tr\xECnh du h\u1ECDc",
  "page.studyAbroad.programsDescription": "Cam k\u1EBFt t\u1EF7 l\u1EC7 \u0111\u1EADu visa cao, chi ph\xED minh b\u1EA1ch r\xF5 r\xE0ng v\xE0 kh\xF4ng ph\u1EE5 ph\xED ph\xE1t sinh ngo\xE0i h\u1EE3p \u0111\u1ED3ng.",
  "page.studyAbroad.benefitsLabel": "Quy\u1EC1n l\u1EE3i n\u1ED5i b\u1EADt c\u1EE7a h\u1ECDc vi\xEAn:",
  "page.studyAbroad.fieldsLabel": "Ng\xE0nh \u0111\xE0o t\u1EA1o tr\u1ECDng \u0111i\u1EC3m:",
  "page.studyAbroad.requirementsLabel": "\u0110i\u1EC1u ki\u1EC7n tham gia:",
  "page.studyAbroad.intake": "K\u1EF3 tuy\u1EC3n sinh g\u1EA7n nh\u1EA5t: Th\xE1ng 4 & Th\xE1ng 9 / 2026",
  "page.studyAbroad.programConsult": "\u0110\u0103ng k\xFD t\u01B0 v\u1EA5n ch\u01B0\u01A1ng tr\xECnh n\xE0y",
  "page.studyAbroad.roadmapDescription": "Quy tr\xECnh kh\xE9p k\xEDn gi\xFAp h\u1ECDc sinh v\xE0 ph\u1EE5 huynh an t\xE2m v\u1EC1 ch\u1EA5t l\u01B0\u1EE3ng \u0111\xE0o t\u1EA1o v\xE0 t\u01B0\u01A1ng lai ngh\u1EC1 nghi\u1EC7p.",
  "page.studyAbroad.centerName": "Trung t\xE2m T\u01B0 v\u1EA5n Du h\u1ECDc \xC2u L\u1EA1c (ALCM)",
  "page.studyAbroad.appointmentCta": "\u0110\u0103ng k\xFD h\u1EB9n t\u01B0 v\u1EA5n 1-1 mi\u1EC5n ph\xED",
  "page.projects.eyebrow": "D\u1EF1 \xC1n Tr\u1ECDng \u0110i\u1EC3m & Ch\xEDnh S\xE1ch \u0110\xE3i Ng\u1ED9 2026",
  "page.projects.referralCta": "N\u1ED9p th\xF4ng tin gi\u1EDBi thi\u1EC7u nh\u1EADn th\u01B0\u1EDFng",
  "page.projects.viewHotProjects": "Xem danh s\xE1ch d\u1EF1 \xE1n HOT",
  "page.projects.featuredDescription": "C\xE1c d\u1EF1 \xE1n \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt theo ti\u1EBFn \u0111\u1ED9 h\u1EE3p \u0111\u1ED3ng th\u1EF1c t\u1EBF v\u1EDBi c\xE1c ch\u1EE7 t\xE0u v\xE0 nghi\u1EC7p \u0111o\xE0n qu\u1ED1c t\u1EBF.",
  "page.projects.deadline": "H\u1EA1n:",
  "page.projects.partner": "\u0110\u1ED1i t\xE1c:",
  "page.projects.viewDivision": "Chi ti\u1EBFt kh\u1ED1i",
  "page.projects.apply": "N\u1ED9p \u0111\u01A1n d\u1EF1 \xE1n",
  "page.news.eyebrow": "C\u1EADp Nh\u1EADt Th\u1ECB Tr\u01B0\u1EDDng H\xE0ng H\u1EA3i & Tuy\u1EC3n D\u1EE5ng 2026",
  "home.news.eyebrow": "Th\xF4ng tin th\u1ECB tr\u01B0\u1EDDng & \u0110\xE0o t\u1EA1o",
  "page.news.jobsLink": "Vi\u1EC7c l\xE0m \u0111ang tuy\u1EC3n",
  "page.news.fleetLink": "\u0110\u1ED9i t\xE0u & \u0110\u1ED1i t\xE1c",
  "page.news.eventsLink": "L\u1ECBch ph\u1ECFng v\u1EA5n & H\u1ED9i th\u1EA3o",
  "page.news.industryLink": "B\u1EA3n tin ng\xE0nh",
  "home.news.description": "C\u1EADp nh\u1EADt th\xF4ng tin m\u1EDBi nh\u1EA5t v\u1EC1 l\u1ECBch ph\u1ECFng v\u1EA5n tuy\u1EC3n ch\u1ECDn thuy\u1EC1n vi\xEAn, ch\xEDnh s\xE1ch visa lao \u0111\u1ED9ng Nh\u1EADt - \u0110\u1EE9c v\xE0 c\xE1c kh\xF3a b\u1ED3i d\u01B0\u1EE1ng STCW.",
  "home.news.readMore": "Chi ti\u1EBFt",
  "page.about.eyebrow": "H\u1ED3 S\u01A1 Doanh Nghi\u1EC7p & H\u1EC7 Sinh Th\xE1i \xC2u L\u1EA1c",
  "home.contact.eyebrow": "K\u1EBFt n\u1ED1i & \u0110\u1EB7t l\u1ECBch h\u1EB9n",
  "home.contact.description": "Tr\u1EE5 s\u1EDF ch\xEDnh t\u1EA1i TP. H\u1ED3 Ch\xED Minh ti\u1EBFp nh\u1EADn \u1EE9ng vi\xEAn thuy\u1EC1n vi\xEAn v\xE0 ng\u01B0\u1EDDi lao \u0111\u1ED9ng tr\u1EF1c ti\u1EBFp trong gi\u1EDD h\xE0nh ch\xEDnh t\u1EEB th\u1EE9 Hai \u0111\u1EBFn th\u1EE9 B\u1EA3y.",
  "home.contact.addressLabel": "\u0110\u1ECBa ch\u1EC9 v\u0103n ph\xF2ng:",
  "home.contact.mapDirections": "M\u1EDF ch\u1EC9 \u0111\u01B0\u1EDDng tr\xEAn Google Maps",
  "home.contact.phoneLabel": "\u0110i\u1EC7n tho\u1EA1i & Hotline 24/7:",
  "home.contact.copyPhone": "Sao ch\xE9p",
  "home.contact.phoneCopied": "\u0110\xE3 sao ch\xE9p",
  "home.contact.officePhone": "T\u1ED5ng \u0111\xE0i b\xE0n:",
  "home.contact.emailLabel": "H\u1ED9p th\u01B0 \u0111i\u1EC7n t\u1EED:",
  "home.contact.hoursLabel": "Th\u1EDDi gian l\xE0m vi\u1EC7c:",
  "home.contact.hours": "Th\u1EE9 2 \u2013 Th\u1EE9 6: 08:00 \u2013 17:30 \xB7 Th\u1EE9 7: 08:00 \u2013 12:00",
  "home.contact.otherRequest": "G\u1EEDi y\xEAu c\u1EA7u kh\xE1c",
  "home.contact.successDescription": "M\xE3 x\xE1c nh\u1EADn y\xEAu c\u1EA7u c\u1EE7a b\u1EA1n l\xE0 {ticketId}. \u0110\u01A1n v\u1ECB chuy\xEAn tr\xE1ch thu\u1ED9c Kh\u1ED1i {divisionNo} ({divisionName}) s\u1EBD li\xEAn h\u1EC7 l\u1EA1i qua \u0111i\u1EC7n tho\u1EA1i trong v\xF2ng 2 gi\u1EDD l\xE0m vi\u1EC7c.",
  "home.contact.requestDescription": "D\xE0nh cho ch\u1EE7 t\xE0u c\u1EA7n cung \u1EE9ng thuy\u1EC1n b\u1ED9 ho\u1EB7c ng\u01B0\u1EDDi lao \u0111\u1ED9ng c\u1EA7n t\u01B0 v\u1EA5n c\u01A1 h\u1ED9i ngh\u1EC1 nghi\u1EC7p.",
  "home.contact.nameLabel": "H\u1ECD t\xEAn / \u0110\u01A1n v\u1ECB y\xEAu c\u1EA7u",
  "home.contact.namePlaceholder": "VD: Cty T\xE0u Bi\u1EC3n ABC ho\u1EB7c Nguy\u1EC5n V\u0103n A",
  "home.contact.phoneFieldLabel": "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i li\xEAn h\u1EC7",
  "home.contact.phonePlaceholder": "VD: 0903 396 466",
  "home.contact.emailFieldLabel": "Email li\xEAn h\u1EC7",
  "home.contact.forwardToLabel": "Chuy\u1EC3n ti\u1EBFp \u0111\u1EBFn Kh\u1ED1i chuy\xEAn tr\xE1ch",
  "home.contact.routeIndicator": "H\u1EC7 th\u1ED1ng s\u1EBD chuy\u1EC3n ti\u1EBFp tr\u1EF1c ti\u1EBFp \u0111\u1EBFn:",
  "home.contact.messageLabel": "N\u1ED9i dung chi ti\u1EBFt y\xEAu c\u1EA7u",
  "home.contact.messagePlaceholder": "VD: C\u1EA7n cung \u1EE9ng 1 Thuy\u1EC1n tr\u01B0\u1EDFng v\xE0 2 Th\u1EE7y th\u1EE7 cho t\xE0u d\u1EA7u 13,000 DWT nh\u1EADn t\xE0u t\u1EA1i Singapore ng\xE0y 20/11...",
  "home.contact.privacyNotice": "D\u1EEF li\u1EC7u c\u1EE7a b\u1EA1n \u0111\u01B0\u1EE3c b\u1EA3o m\u1EADt theo quy chu\u1EA9n N\u0110 13/2023/N\u0110-CP.",
  "home.contact.submit": "G\u1EEDi y\xEAu c\u1EA7u ch\xEDnh th\u1EE9c",
  "home.contact.mapLink": "Xem tr\xEAn Google Maps",
  "home.about.eyebrow": "Ph\xE1p nh\xE2n & Qu\u1EA3n tr\u1ECB minh b\u1EA1ch",
  "home.about.summary": "Th\xE0nh vi\xEAn h\u1EC7 sinh th\xE1i v\u1EADn t\u1EA3i bi\u1EC3n \xC2u L\u1EA1c, ho\u1EA1t \u0111\u1ED9ng chuy\xEAn nghi\u1EC7p trong l\u0129nh v\u1EF1c cung \u1EE9ng ngu\u1ED3n nh\xE2n l\u1EF1c h\xE0ng h\u1EA3i v\xE0 xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng ch\u1EA5t l\u01B0\u1EE3ng cao.",
  "home.about.profile.0": "C\xF4ng ty C\u1ED5 ph\u1EA7n \xC2u L\u1EA1c Crew Manning (ALCM) ho\u1EA1t \u0111\u1ED9ng theo gi\u1EA5y ch\u1EE9ng nh\u1EADn \u0111\u0103ng k\xFD doanh nghi\u1EC7p s\u1ED1 0317391467 do S\u1EDF K\u1EBF ho\u1EA1ch v\xE0 \u0110\u1EA7u t\u01B0 TP.HCM c\u1EA5p ng\xE0y 21/7/2022.",
  "home.about.profile.1": "Xu\u1EA5t ph\xE1t t\u1EEB nhu c\u1EA7u qu\u1EA3n l\xFD thuy\u1EC1n b\u1ED9 cho \u0111\u1ED9i t\xE0u v\u1EADn t\u1EA3i d\u1EA7u kh\xED vi\u1EC5n d\u01B0\u01A1ng c\u1EE7a T\u1EADp \u0111o\xE0n \xC2u L\u1EA1c, ALCM \u0111\xE3 m\u1EDF r\u1ED9ng th\xE0nh \u0111\u01A1n v\u1ECB cung \u1EE9ng nh\xE2n l\u1EF1c qu\u1ED1c t\u1EBF uy t\xEDn, ph\u1EE5c v\u1EE5 c\xE1c ch\u1EE7 t\xE0u t\u1EA1i Nh\u1EADt B\u1EA3n, H\xE0n Qu\u1ED1c, Singapore, \u0110\xE0i Loan v\xE0 \u0111\u01B0a lao \u0111\u1ED9ng tay ngh\u1EC1 cao sang l\xE0m vi\u1EC7c t\u1EA1i \u0110\u1EE9c.",
  "home.about.profile.2": "V\u1EDBi m\xF4 h\xECnh 5 kh\u1ED1i chuy\xEAn m\xF4n kh\xE9p k\xEDn, ALCM t\u1EF1 ch\u1EE7 t\u1EEB kh\xE2u tuy\u1EC3n ch\u1ECDn, hu\u1EA5n luy\u1EC7n an to\xE0n STCW m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i, b\u1ED3i d\u01B0\u1EE1ng ngo\u1EA1i ng\u1EEF v\xE0 \u1EE9ng d\u1EE5ng AI \u0111\u1EBFn kh\xE2u \u0111\xF3n t\xE0u v\xE0 h\u1ED7 tr\u1EE3 h\u1ED3i h\u01B0\u01A1ng sau khi k\u1EBFt th\xFAc h\u1EE3p \u0111\u1ED3ng.",
  "home.about.founded": "Th\xE0nh l\u1EADp",
  "home.about.taxId": "M\xE3 s\u1ED1 thu\u1EBF",
  "home.about.qualitySystem": "H\u1EC7 th\u1ED1ng QLCL",
  "home.about.maritimeConvention": "C\xF4ng \u01B0\u1EDBc H\xE0ng h\u1EA3i",
  "home.about.licensesTitle": "Ch\u1EE9ng nh\u1EADn & Gi\u1EA5y ph\xE9p ph\xE1p l\xFD",
  "home.about.srpsTitle": "Gi\u1EA5y ch\u1EE9ng nh\u1EADn SRPS (MLC 2006)",
  "home.about.srpsDescription": "\u0110\u1EA1t chu\u1EA9n Ti\xEAu chu\u1EA9n A1.4 v\u1EC1 D\u1ECBch v\u1EE5 Tuy\u1EC3n d\u1EE5ng v\xE0 Cung \u1EE9ng Thuy\u1EC1n vi\xEAn c\u1EE7a T\u1ED5 ch\u1EE9c Lao \u0111\u1ED9ng Qu\u1ED1c t\u1EBF (ILO).",
  "home.about.isoTitle": "H\u1EC7 th\u1ED1ng qu\u1EA3n l\xFD ch\u1EA5t l\u01B0\u1EE3ng ISO 9001:2015",
  "home.about.isoDescription": "\u0110\u01B0\u1EE3c \u0111\xE1nh gi\xE1 v\xE0 ch\u1EE9ng nh\u1EADn \u0111\u1ECBnh k\u1EF3 b\u1EDFi t\u1ED5 ch\u1EE9c gi\xE1m \u0111\u1ECBnh qu\u1ED1c t\u1EBF \u0111\u1ED9c l\u1EADp.",
  "home.about.overseasLicenseTitle": "Gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng \u0111\u01B0a ng\u01B0\u1EDDi lao \u0111\u1ED9ng \u0111i l\xE0m vi\u1EC7c \u1EDF n\u01B0\u1EDBc ngo\xE0i",
  "home.about.overseasLicenseDescription": "\u0110\u1EA7y \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n ph\xE1p l\xFD th\u1EF1c hi\u1EC7n c\xE1c h\u1EE3p \u0111\u1ED3ng cung \u1EE9ng lao \u0111\u1ED9ng theo Lu\u1EADt s\u1ED1 69/2020/QH14.",
  "home.about.orgChartTitle": "S\u01A1 \u0111\u1ED3 c\u01A1 c\u1EA5u t\u1ED5 ch\u1EE9c c\xF4ng ty",
  "home.about.orgChartDescription": "Ph\xE2n quy\u1EC1n r\xF5 r\xE0ng, c\xF3 Ban ki\u1EC3m so\xE1t \u0111\u1ED9c l\u1EADp v\xE0 \u0110\u1EA1i di\u1EC7n l\xE3nh \u0111\u1EA1o ch\u1EA5t l\u01B0\u1EE3ng ISO \xB7 MLC chuy\xEAn tr\xE1ch.",
  "home.about.shareholders": "\u0110\u1EA1i h\u1ED9i \u0111\u1ED3ng c\u1ED5 \u0111\xF4ng (General Meeting of Shareholders)",
  "home.about.board": "H\u1ED9i \u0111\u1ED3ng qu\u1EA3n tr\u1ECB (Board of Directors)",
  "home.about.supervisoryBoard": "Ban ki\u1EC3m so\xE1t \u0111\u1ED9c l\u1EADp (Supervisory Board)",
  "home.about.generalDirector": "T\u1ED5ng Gi\xE1m \u0110\u1ED1c (General Director)",
  "home.about.qualityRepresentative": "\u0110\u1EA1i di\u1EC7n l\xE3nh \u0111\u1EA1o ch\u1EA5t l\u01B0\u1EE3ng (ISO \xB7 MLC)",
  "home.about.divisionsPrompt": "5 Kh\u1ED1i chuy\xEAn m\xF4n tr\u1EF1c thu\u1ED9c (Nh\u1EA5n ch\u1ECDn \u0111\u1EC3 xem ph\xF2ng ban):",
  "home.about.unitsHeading": "C\xE1c \u0111\u01A1n v\u1ECB tr\u1EF1c thu\u1ED9c Kh\u1ED1i",
  "home.security.orgChartCta": "Xem c\u01A1 c\u1EA5u t\u1ED5 ch\u1EE9c & Ban ki\u1EC3m so\xE1t",
  "home.gallery.eyebrow": "Th\u01B0 vi\u1EC7n h\xECnh \u1EA3nh th\u1EF1c t\u1EBF",
  "home.gallery.description": "Ghi l\u1EA1i nh\u1EEFng kho\u1EA3nh kh\u1EAFc ch\xE2n th\u1EF1c t\u1EEB bu\u1ED3ng l\xE1i t\xE0u bi\u1EC3n, trung t\xE2m m\xF4 ph\u1ECFng STCW \u0111\u1EBFn m\xF4i tr\u01B0\u1EDDng l\xE0m vi\u1EC7c c\u1EE7a k\u1EF9 s\u01B0 v\xE0 \u0111i\u1EC1u d\u01B0\u1EE1ng vi\xEAn t\u1EA1i n\u01B0\u1EDBc ngo\xE0i.",
  "home.gallery.count": "{count} h\xECnh \u1EA3nh t\u01B0 li\u1EC7u",
  "home.gallery.category.all": "T\u1EA5t c\u1EA3 h\xECnh \u1EA3nh",
  "home.gallery.category.crew": "Thuy\u1EC1n vi\xEAn & Bu\u1ED3ng l\xE1i",
  "home.gallery.category.fleet": "\u0110\u1ED9i t\xE0u & C\u1EA3ng bi\u1EC3n",
  "home.gallery.category.training": "Hu\u1EA5n luy\u1EC7n STCW",
  "home.gallery.category.engineer": "K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n",
  "home.gallery.category.healthcare": "\u0110i\u1EC1u d\u01B0\u1EE1ng CHLB \u0110\u1EE9c",
  "home.gallery.viewImage": "Xem \u1EA3nh",
  "home.gallery.closeImage": "\u0110\xF3ng \u1EA3nh",
  "home.gallery.materialId": "M\xE3 t\u01B0 li\u1EC7u:",
  "home.gallery.item.G01.title": "S\u0129 quan Thuy\u1EC1n tr\u01B0\u1EDFng & M\xE1y tr\u01B0\u1EDFng tr\xEAn bu\u1ED3ng l\xE1i t\xE0u bi\u1EC3n",
  "home.gallery.item.G01.description": "\u0110\u1ED9i ng\u0169 s\u0129 quan qu\u1EA3n l\xFD \u0111\u01B0\u1EE3c tuy\u1EC3n ch\u1ECDn v\xE0 b\u1ED1 tr\xED theo quy chu\u1EA9n SRPS c\u1EE7a C\xF4ng \u01B0\u1EDBc MLC 2006, th\xE0nh th\u1EA1o ngo\u1EA1i ng\u1EEF h\xE0ng h\u1EA3i v\xE0 h\u1EC7 th\u1ED1ng gi\xE1m s\xE1t h\u1EA3i tr\xECnh ECDIS.",
  "home.gallery.item.G01.category": "Thuy\u1EC1n vi\xEAn",
  "home.gallery.item.G01.tag.0": "S\u0129 quan h\xE0ng h\u1EA3i",
  "home.gallery.item.G01.tag.1": "Bu\u1ED3ng l\xE1i t\xE0u d\u1EA7u",
  "home.gallery.item.G01.tag.2": "Chu\u1EA9n STCW II/2",
  "home.gallery.item.G02.title": "H\u1EC7 th\u1ED1ng m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i to\xE0n c\u1EA3nh Full-Mission Simulator",
  "home.gallery.item.G02.description": "Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c (Kh\u1ED1i 02) trang b\u1ECB ph\xF2ng m\xF4 ph\u1ECFng 360 \u0111\u1ED9 hi\u1EC7n \u0111\u1EA1i, gi\xFAp thuy\u1EC1n vi\xEAn l\xE0m quen v\u1EDBi lu\u1ED3ng l\u1EA1ch ph\u1EE9c t\u1EA1p v\xE0 quy t\u1EAFc tr\xE1nh va COLREG.",
  "home.gallery.item.G02.category": "\u0110\xE0o t\u1EA1o STCW",
  "home.gallery.item.G02.tag.0": "Trung t\xE2m Hu\u1EA5n luy\u1EC7n",
  "home.gallery.item.G02.tag.1": "M\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i",
  "home.gallery.item.G02.tag.2": "Radar & ARPA",
  "home.gallery.item.G03.title": "K\u1EF9 s\u01B0 c\u01A1 kh\xED & T\u1EF1 \u0111\u1ED9ng ho\xE1 l\xE0m vi\u1EC7c t\u1EA1i nh\xE0 m\xE1y Nh\u1EADt B\u1EA3n",
  "home.gallery.item.G03.description": "K\u1EF9 s\u01B0 Vi\u1EC7t Nam do Kh\u1ED1i 03 tuy\u1EC3n ch\u1ECDn v\xE0 \u0111\xE0o t\u1EA1o ti\u1EBFng Nh\u1EADt N3 \u0111ang v\u1EADn h\xE0nh robot c\xF4ng nghi\u1EC7p v\xE0 m\xE1y CNC ch\xEDnh x\xE1c t\u1EA1i c\xE1c t\u1EADp \u0111o\xE0n s\u1EA3n xu\u1EA5t v\xF9ng Aichi, Nh\u1EADt B\u1EA3n.",
  "home.gallery.item.G03.category": "K\u1EF9 s\u01B0",
  "home.gallery.item.G03.tag.0": "Visa K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n",
  "home.gallery.item.G03.tag.1": "Robot Motoman",
  "home.gallery.item.G03.tag.2": "C\u01A1 \u0111i\u1EC7n t\u1EED",
  "home.gallery.item.G04.title": "\u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn chuy\xEAn nghi\u1EC7p t\u1EA1i h\u1EC7 th\u1ED1ng vi\u1EC7n d\u01B0\u1EE1ng l\xE3o CHLB \u0110\u1EE9c",
  "home.gallery.item.G04.description": "\u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn Vi\u1EC7t Nam \u0111\u01B0\u1EE3c \u0111\xE0o t\u1EA1o ti\u1EBFng \u0110\u1EE9c B1/B2 v\xE0 gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng, h\u01B0\u1EDFng m\u1EE9c l\u01B0\u01A1ng v\xE0 quy\u1EC1n l\u1EE3i b\xECnh \u0111\u1EB3ng theo thang l\u01B0\u01A1ng y t\u1EBF li\xEAn bang \u0110\u1EE9c.",
  "home.gallery.item.G04.category": "Y t\u1EBF & \u0110i\u1EC1u d\u01B0\u1EE1ng",
  "home.gallery.item.G04.tag.0": "\u0110i\u1EC1u d\u01B0\u1EE1ng CHLB \u0110\u1EE9c",
  "home.gallery.item.G04.tag.1": "B\u1EA3o hi\u1EC3m c\xF4ng l\u1EADp",
  "home.gallery.item.G04.tag.2": "\u0110\u1ECBnh c\u01B0 d\xE0i h\u1EA1n",
  "home.gallery.item.G05.title": "T\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m Aulac c\u1EADp c\u1EA7u c\u1EA3ng xu\u1EA5t nh\u1EADp h\xE0ng qu\u1ED1c t\u1EBF",
  "home.gallery.item.G05.description": "T\xE0u v\u1EADn t\u1EA3i d\u1EA7u v\xE0 h\xF3a ch\u1EA5t thu\u1ED9c \u0111\u1ED9i t\xE0u ph\u1EE5c v\u1EE5, k\u1EBFt n\u1ED1i h\u1EC7 th\u1ED1ng xu\u1EA5t nh\u1EADp h\xE0ng t\u1EA1i c\u1EA3ng n\u01B0\u1EDBc s\xE2u v\xE0 tu\xE2n th\u1EE7 nghi\xEAm quy tr\xECnh an to\xE0n ISGOTT.",
  "home.gallery.item.G05.category": "\u0110\u1ED9i t\xE0u",
  "home.gallery.item.G05.tag.0": "T\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m",
  "home.gallery.item.G05.tag.1": "L\xE0m h\xE0ng c\u1EA3ng bi\u1EC3n",
  "home.gallery.item.G05.tag.2": "An to\xE0n ISGOTT",
  "home.gallery.item.G06.title": "T\xE0u vi\u1EC5n d\u01B0\u01A1ng Aulac h\xE0nh tr\xECnh tr\xEAn h\u1EA3i ph\u1EADn qu\u1ED1c t\u1EBF",
  "home.gallery.item.G06.description": "\u0110\u1ED9i t\xE0u th\u01B0\u01A1ng m\u1EA1i do thuy\u1EC1n vi\xEAn ALCM tr\u1EF1c ti\u1EBFp v\u1EADn h\xE0nh th\u01B0\u1EDDng xuy\xEAn ho\u1EA1t \u0111\u1ED9ng tr\xEAn c\xE1c tuy\u1EBFn v\u1EADn t\u1EA3i bi\u1EC3n \u0110\xF4ng Nam \xC1, \u0110\xF4ng B\u1EAFc \xC1 v\xE0 Trung \u0110\xF4ng.",
  "home.gallery.item.G06.category": "\u0110\u1ED9i t\xE0u",
  "home.gallery.item.G06.tag.0": "\u0110\u1ED9i t\xE0u \xC2u L\u1EA1c",
  "home.gallery.item.G06.tag.1": "Tuy\u1EBFn Vi\u1EC5n \u0110\xF4ng",
  "home.gallery.item.G06.tag.2": "\u0110\u0103ng ki\u1EC3m qu\u1ED1c t\u1EBF",
  "home.gallery.item.G07.title": "Hu\u1EA5n luy\u1EC7n an to\xE0n h\xE0ng h\u1EA3i v\xE0 sinh t\u1ED3n tr\xEAn bi\u1EC3n STCW",
  "home.gallery.item.G07.description": "Thuy\u1EC1n vi\xEAn th\u1EF1c h\xE0nh x\u1EED l\xFD s\u1EF1 c\u1ED1 kh\u1EA9n c\u1EA5p, hu\u1EA5n luy\u1EC7n ph\xF2ng ch\xE1y ch\u1EEFa ch\xE1y n\xE2ng cao v\xE0 s\u1EED d\u1EE5ng thi\u1EBFt b\u1ECB c\u1EE9u sinh tr\u01B0\u1EDBc khi \u0111\u01B0\u1EE3c c\u1EA5p ch\u1EE9ng ch\u1EC9.",
  "home.gallery.item.G07.category": "\u0110\xE0o t\u1EA1o STCW",
  "home.gallery.item.G07.tag.0": "STCW An to\xE0n",
  "home.gallery.item.G07.tag.1": "Ph\xF2ng ch\xE1y t\xE0u bi\u1EC3n",
  "home.gallery.item.G07.tag.2": "Quy t\u1EAFc an to\xE0n",
  "home.gallery.item.G08.title": "Nh\xE2n l\u1EF1c k\u1EF9 thu\u1EADt y t\u1EBF & C\xF4ng ngh\u1EC7 cao t\u1EA1i n\u01B0\u1EDBc ngo\xE0i",
  "home.gallery.item.G08.description": "\u0110\u1ED9i ng\u0169 chuy\xEAn vi\xEAn y t\u1EBF k\u1EF9 thu\u1EADt cao ph\u1ED1i h\u1EE3p l\xE0m vi\u1EC7c trong m\xF4i tr\u01B0\u1EDDng \u0111a qu\u1ED1c gia v\u1EDBi \u0111\u1EA7y \u0111\u1EE7 ph\xFAc l\u1EE3i v\xE0 c\u01A1 h\u1ED9i n\xE2ng cao tay ngh\u1EC1.",
  "home.gallery.item.G08.category": "Y t\u1EBF & \u0110i\u1EC1u d\u01B0\u1EE1ng",
  "home.gallery.item.G08.tag.0": "Chuy\xEAn gia k\u1EF9 thu\u1EADt",
  "home.gallery.item.G08.tag.1": "Y t\u1EBF ch\u1EA5t l\u01B0\u1EE3ng cao",
  "home.gallery.item.G08.tag.2": "M\xF4i tr\u01B0\u1EDDng qu\u1ED1c t\u1EBF",
  "home.fleet.eyebrow": "\u0110\u1ED9i t\xE0u & Kh\xE1ch h\xE0ng \u0111\u1ED1i t\xE1c",
  "home.fleet.description": "H\u1EC7 sinh th\xE1i t\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m, t\xE0u h\xF3a ch\u1EA5t v\xE0 t\xE0u ch\u1EDF h\xE0ng r\u1EDDi hi\u1EC7n \u0111\u1EA1i, \u0111\u1EA3m b\u1EA3o m\xF4i tr\u01B0\u1EDDng l\xE0m vi\u1EC7c chu\u1EA9n qu\u1ED1c t\u1EBF v\xE0 an to\xE0n cho thuy\u1EC1n vi\xEAn.",
  "home.fleet.view.sea": "H\u1EA3i tr\xECnh tr\xEAn bi\u1EC3n",
  "home.fleet.view.port": "L\xE0m h\xE0ng t\u1EA1i c\u1EA3ng",
  "home.fleet.image.sea": "G\xF3c nh\xECn: H\u1EA3i tr\xECnh tr\xEAn bi\u1EC3n",
  "home.fleet.image.port": "G\xF3c nh\xECn: L\xE0m h\xE0ng t\u1EA1i c\u1EA7u c\u1EA3ng",
  "home.fleet.watermark.label": "H\u1EC6 TH\u1ED0NG \u0110\u1ED8I T\xC0U ALCM",
  "home.fleet.watermark.sublabel": "V\u1EADn h\xE0nh chu\u1EA9n ISGOTT & MLC",
  "home.fleet.id": "M\xE3 t\xE0u:",
  "home.fleet.status": "\u0110ang khai th\xE1c th\u01B0\u01A1ng m\u1EA1i",
  "home.fleet.type": "Lo\u1EA1i t\xE0u:",
  "home.fleet.dwt": "Tr\u1ECDng t\u1EA3i:",
  "home.fleet.flag": "Qu\u1ED1c t\u1ECBch treo c\u1EDD:",
  "home.fleet.tradingArea": "V\xF9ng ho\u1EA1t \u0111\u1ED9ng:",
  "home.fleet.crewComplement": "\u0110\u1ECBnh bi\xEAn thuy\u1EC1n b\u1ED9:",
  "home.fleet.apply": "\u1EE8ng tuy\u1EC3n v\xE0o \u0111\u1ED9i t\xE0u \xC2u L\u1EA1c",
  "home.fleet.country.vietnam": "Vi\u1EC7t Nam (VR)",
  "page.offshore.capability.2.code": "D\u1EA7u kh\xED & Bi\u1EC3n xa",
  "page.training.center.2.code": "AI & Chuy\u1EC3n \u0111\u1ED5i s\u1ED1",
  "page.training.center.3.code": "B\u1ED9 L\u0110-TB&XH & MLC",
  "home.events.remoteTitle": "B\u1EA1n \u0111ang l\xE0m vi\u1EC7c tr\xEAn bi\u1EC3n ho\u1EB7c \u1EDF xa TP.HCM?",
  "home.events.remoteDescription": "To\xE0n b\u1ED9 c\xE1c bu\u1ED5i ph\u1ECFng v\u1EA5n v\xE0 h\u1ED9i th\u1EA3o \u0111\u1EC1u h\u1ED7 tr\u1EE3 ph\xF2ng h\u1ECDp Zoom Meeting tr\u1EF1c tuy\u1EBFn 1:1 c\xF9ng ch\u1EE7 t\xE0u.",
  "home.events.privateHotline": "Hotline \u0111\u1EB7t l\u1ECBch ri\xEAng:",
  "home.events.monthPrefix": "Th\xE1ng",
  "home.events.location.hybrid": "Tr\u1EF1c ti\u1EBFp & Zoom",
  "home.events.location.onlineOnly": "Tr\u1EF1c tuy\u1EBFn 100%",
  "home.events.location.headOffice": "T\u1EA1i Tr\u1EE5 s\u1EDF TP.HCM",
  "home.events.almostFull": "S\u1EAFp h\u1EBFt ch\u1ED7 ({count} ch\u1ED7 c\xF2n l\u1EA1i)",
  "home.events.hostsLabel": "\u0110\u01A1n v\u1ECB ch\u1EE7 tr\xEC & Kh\xE1ch m\u1EDDi:",
  "home.events.highlightsLabel": "Quy\u1EC1n l\u1EE3i khi tham gia:",
  "home.events.audienceLabel": "\u0110\u1ED1i t\u01B0\u1EE3ng ph\xF9 h\u1EE3p:",
  "home.events.seatsProgress": "Ti\u1EBFn \u0111\u1ED9 gi\u1EEF ch\u1ED7:",
  "home.events.registeredProgress": "{registered}/{max} ng\u01B0\u1EDDi \u0111\xE3 \u0111\u0103ng k\xFD ({percent}%)",
  "home.events.questionLabel": "C\xE2u h\u1ECFi b\u1EA1n mu\u1ED1n g\u1EEDi tr\u01B0\u1EDBc cho Ch\u1EE7 t\xE0u / Di\u1EC5n gi\u1EA3 (t\xF9y ch\u1ECDn)",
  "home.events.cancel": "H\u1EE7y",
  "home.security.eyebrow": "Ti\xEAu chu\u1EA9n b\u1EA3o m\u1EADt & Ph\xE1p l\xFD",
  "home.security.description": "H\u1EC7 sinh th\xE1i tuy\u1EC3n d\u1EE5ng v\xE0 cung \u1EE9ng ALCM \u0111\u1EB7t s\u1EF1 an to\xE0n th\xF4ng tin c\xE1 nh\xE2n v\xE0 quy\u1EC1n l\u1EE3i ng\u01B0\u1EDDi lao \u0111\u1ED9ng l\xEAn h\xE0ng \u0111\u1EA7u, tu\xE2n th\u1EE7 ch\u1EB7t ch\u1EBD ph\xE1p lu\u1EADt Vi\u1EC7t Nam v\xE0 c\xE1c c\xF4ng \u01B0\u1EDBc h\xE0ng h\u1EA3i qu\u1ED1c t\u1EBF.",
  "home.security.privacyDescription": "M\u1ECDi th\xF4ng tin nh\u01B0 c\u0103n c\u01B0\u1EDBc c\xF4ng d\xE2n, s\u1ED1 \u0111i\u1EC7n tho\u1EA1i, l\xFD l\u1ECBch \u0111i bi\u1EC3n v\xE0 ch\u1EE9ng ch\u1EC9 STCW c\u1EE7a thuy\u1EC1n vi\xEAn \u0111\u01B0\u1EE3c m\xE3 h\xF3a l\u01B0u tr\u1EEF v\u1EDBi quy\u1EC1n truy c\u1EADp n\u1ED9i b\u1ED9.",
  "home.security.privacyPoint.0": "M\xE3 h\xF3a \u0111\u01B0\u1EDDng truy\u1EC1n TLS 1.3 ch\u1ED1ng nghe l\xE9n",
  "home.security.privacyPoint.1": "M\xE3 PIN 4 s\u1ED1 ri\xEAng bi\u1EC7t cho t\u1EEBng h\u1ED3 s\u01A1 tra c\u1EE9u",
  "home.security.privacyPoint.2": "Kh\xF4ng chia s\u1EBB cho b\xEAn th\u1EE9 ba ngo\xE0i m\u1EE5c \u0111\xEDch tuy\u1EC3n d\u1EE5ng",
  "home.security.mlcDescription": "ALCM \u0111\u01B0\u1EE3c c\u1EA5p ch\u1EE9ng nh\u1EADn D\u1ECBch v\u1EE5 Tuy\u1EC3n d\u1EE5ng v\xE0 Cung \u1EE9ng Thuy\u1EC1n vi\xEAn (SRPS) tu\xE2n th\u1EE7 Ti\xEAu chu\u1EA9n A1.4 c\u1EE7a C\xF4ng \u01B0\u1EDBc MLC 2006.",
  "home.security.mlcPoint.0": "Tuy\u1EC7t \u0111\u1ED1i kh\xF4ng thu ph\xED tuy\u1EC3n d\u1EE5ng t\u1EEB thuy\u1EC1n vi\xEAn",
  "home.security.mlcPoint.1": "B\u1EA3o hi\u1EC3m tr\xE1ch nhi\u1EC7m d\xE2n s\u1EF1 P&I qu\u1ED1c t\u1EBF to\xE0n di\u1EC7n",
  "home.security.mlcPoint.2": "B\u1EA3o \u0111\u1EA3m quy\u1EC1n h\u1ED3i h\u01B0\u01A1ng mi\u1EC5n ph\xED theo h\u1EE3p \u0111\u1ED3ng",
  "home.security.antiScamDescription": "B\u1EA3o v\u1EC7 \u1EE9ng vi\xEAn tr\u01B0\u1EDBc c\xE1c h\xECnh th\u1EE9c gi\u1EA3 m\u1EA1o th\u01B0\u01A1ng hi\u1EC7u, thu ph\xED tr\xE1i ph\xE9p v\xE0 l\u1EEBa \u0111\u1EA3o tuy\u1EC3n d\u1EE5ng.",
  "home.security.antiScamPoint.0": "Kh\xF4ng giao d\u1ECBch qua t\xE0i kho\u1EA3n ng\xE2n h\xE0ng c\xE1 nh\xE2n",
  "home.security.antiScamPoint.1": "Email x\xE1c nh\u1EADn ch\xEDnh th\u1EE9c s\u1EED d\u1EE5ng @alcrewmanning.vn",
  "home.security.antiScamPoint.2": "\u0110\u01B0\u1EDDng d\xE2y n\xF3ng ph\u1EA3n \xE1nh 24/7: 0903 396 466",
  "home.security.licenseTitle": "Gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng XKL\u0110 & Cung \u1EE9ng thuy\u1EC1n vi\xEAn h\u1EE3p ph\xE1p",
  "home.security.licenseDescription": "Gi\u1EA5y ch\u1EE9ng nh\u1EADn \u0111\u0103ng k\xFD kinh doanh s\u1ED1 0317391467 do S\u1EDF KH&\u0110T TP.HCM c\u1EA5p ng\xE0y 21/7/2022. \u0110\u1EA1t ti\xEAu chu\u1EA9n ISO 9001:2015 v\xE0 Gi\u1EA5y ch\u1EE9ng nh\u1EADn SRPS theo MLC 2006.",
  "home.journey.eyebrow": "M\u1ED9t \u0111\u1EA7u m\u1ED1i, tr\u1ECDn h\xE0nh tr\xECnh",
  "home.journey.description": "T\u1EEB khi n\u1ED9p h\u1ED3 s\u01A1 \u0111\u1EBFn khi \u0111\xF3n t\xE0u ho\u1EB7c xu\u1EA5t c\u1EA3nh v\xE0 tr\u1EDF v\u1EC1 n\u01B0\u1EDBc, ng\u01B0\u1EDDi lao \u0111\u1ED9ng lu\xF4n c\xF3 \u0111\u01A1n v\u1ECB chuy\xEAn tr\xE1ch c\u1EE7a ALCM tr\u1EF1c ti\u1EBFp \u0111\u1ED3ng h\xE0nh.",
  "home.journey.activeStep": "\u0110ang xem",
  "home.journey.stepLabel": "B\u01AF\u1EDAC",
  "home.journey.responsibleUnits": "C\xE1c ph\xF2ng ban v\xE0 trung t\xE2m tr\u1EF1c ti\u1EBFp th\u1EF1c hi\u1EC7n:",
  "home.journey.step.0.title": "T\u01B0 v\u1EA5n & Tuy\u1EC3n ch\u1ECDn",
  "home.journey.step.0.subtitle": "Ch\u1ECDn \u0111\xFAng ng\u01B0\u1EDDi, \u0111\xFAng v\u1ECB tr\xED",
  "home.journey.step.0.description": "S\u01A1 tuy\u1EC3n, th\u1EA9m \u0111\u1ECBnh b\u1EB1ng c\u1EA5p ch\u1EE9ng ch\u1EC9 STCW, ki\u1EC3m tra tay ngh\u1EC1 v\xE0 ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp v\u1EDBi ch\u1EE7 t\xE0u ho\u1EB7c doanh nghi\u1EC7p ti\u1EBFp nh\u1EADn n\u01B0\u1EDBc ngo\xE0i.",
  "home.journey.step.0.unit.0": "Ph\xF2ng Tuy\u1EC3n d\u1EE5ng & Cung \u1EE9ng thuy\u1EC1n vi\xEAn (SRPS)",
  "home.journey.step.0.unit.1": "Ph\xF2ng Nghi\u1EC7p v\u1EE5 qu\u1EA3n l\xFD lao \u0111\u1ED9ng n\u01B0\u1EDBc ngo\xE0i",
  "home.journey.step.1.title": "\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
  "home.journey.step.1.subtitle": "Ch\u1EE9ng ch\u1EC9, ngo\u1EA1i ng\u1EEF, tin h\u1ECDc & AI",
  "home.journey.step.1.description": "Hu\u1EA5n luy\u1EC7n an to\xE0n h\xE0ng h\u1EA3i c\u01A1 b\u1EA3n v\xE0 n\xE2ng cao, m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i/bu\u1ED3ng m\xE1y, ti\u1EBFng Anh h\xE0ng h\u1EA3i, ti\u1EBFng Nh\u1EADt N4/N3, ti\u1EBFng \u0110\u1EE9c B1 v\xE0 k\u1EF9 n\u0103ng \u1EE9ng d\u1EE5ng AI.",
  "home.journey.step.1.unit.0": "Trung t\xE2m Hu\u1EA5n luy\u1EC7n thuy\u1EC1n vi\xEAn \xC2u L\u1EA1c",
  "home.journey.step.1.unit.1": "Trung t\xE2m \u0110\xE0o t\u1EA1o ngo\u1EA1i ng\u1EEF tin h\u1ECDc \xC2u L\u1EA1c",
  "home.journey.step.1.unit.2": "Trung t\xE2m \u0110\xE0o t\u1EA1o \u1EE9ng d\u1EE5ng tr\xED tu\u1EC7 nh\xE2n t\u1EA1o",
  "home.journey.step.2.title": "Gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng",
  "home.journey.step.2.subtitle": "Ph\xE1p lu\u1EADt, v\u0103n h\xF3a, k\u1EF7 lu\u1EADt lao \u0111\u1ED9ng",
  "home.journey.step.2.description": "Kh\xF3a gi\xE1o d\u1EE5c b\u1EAFt bu\u1ED9c tr\u01B0\u1EDBc xu\u1EA5t c\u1EA3nh v\u1EC1 ph\xE1p lu\u1EADt n\u01B0\u1EDBc s\u1EDF t\u1EA1i, n\u1ED9i dung h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng, an to\xE0n ngh\u1EC1 nghi\u1EC7p v\xE0 quy\u1EC1n l\u1EE3i theo MLC 2006.",
  "home.journey.step.2.unit.0": "Ph\xF2ng Gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng",
  "home.journey.step.2.unit.1": "Ph\xF2ng T\u01B0 v\u1EA5n ph\xE1p ch\u1EBF an to\xE0n t\xE0u",
  "home.journey.step.3.title": "Cung \u1EE9ng & L\xE0m vi\u1EC7c",
  "home.journey.step.3.subtitle": "L\xEAn t\xE0u vi\u1EC5n d\u01B0\u01A1ng, xu\u1EA5t c\u1EA3nh l\xE0m vi\u1EC7c",
  "home.journey.step.3.description": "Ho\xE0n thi\u1EC7n visa, v\xE9 m\xE1y bay, b\u1EA3o hi\u1EC3m P&I, \u0111\xF3n t\xE0u t\u1EA1i c\u1EA3ng qu\u1ED1c t\u1EBF ho\u1EB7c \u1ED5n \u0111\u1ECBnh sinh ho\u1EA1t v\xE0 l\xE0m vi\u1EC7c t\u1EA1i nh\xE0 m\xE1y, b\u1EC7nh vi\u1EC7n n\u01B0\u1EDBc ngo\xE0i.",
  "home.journey.step.3.unit.0": "Ph\xF2ng Tuy\u1EC3n d\u1EE5ng & Cung \u1EE9ng thuy\u1EC1n vi\xEAn",
  "home.journey.step.3.unit.1": "Ph\xF2ng Qu\u1EA3n l\xFD t\xE0u",
  "home.journey.step.3.unit.2": "Ph\xF2ng Qu\u1EA3n l\xFD lao \u0111\u1ED9ng n\u01B0\u1EDBc ngo\xE0i",
  "home.journey.step.4.title": "\u0110\u1ED3ng h\xE0nh & V\u1EC1 n\u01B0\u1EDBc",
  "home.journey.step.4.subtitle": "An to\xE0n OHS, b\u1EA3o hi\u1EC3m, t\xE1i h\xF2a nh\u1EADp",
  "home.journey.step.4.description": "H\u1ED7 tr\u1EE3 quy\u1EC1n l\u1EE3i b\u1EA3o hi\u1EC3m, gi\u1EA3i \u0111\xE1p v\u01B0\u1EDBng m\u1EAFc 24/7, \u0111\xF3n ti\u1EBFp khi ho\xE0n th\xE0nh h\u1EE3p \u0111\u1ED3ng, thanh l\xFD ch\u1EBF \u0111\u1ED9 v\xE0 gi\u1EDBi thi\u1EC7u vi\u1EC7c l\xE0m m\u1EDBi ho\u1EB7c b\u1ED1 tr\xED chuy\u1EBFn t\xE0u k\u1EBF ti\u1EBFp.",
  "home.journey.step.4.unit.0": "Ph\xF2ng An to\xE0n v\u1EC7 sinh lao \u0111\u1ED9ng (OHS)",
  "home.journey.step.4.unit.1": "Ph\xF2ng H\u1ED7 tr\u1EE3 lao \u0111\u1ED9ng v\u1EC1 n\u01B0\u1EDBc",
  "home.journey.divisionLabel": "Kh\u1ED1i",
  "home.referral.programLabel": "Ch\u01B0\u01A1ng tr\xECnh Gi\u1EDBi thi\u1EC7u Thuy\u1EC1n vi\xEAn & B\u1EA1n b\xE8 (Crew Referral Program)",
  "home.referral.maxReward": "15.000.000 VN\u0110 / Thuy\u1EC1n Vi\xEAn",
  "home.referral.description": "D\xE0nh ri\xEAng cho thuy\u1EC1n vi\xEAn \u0111ang \u0111i t\xE0u, lao \u0111\u1ED9ng l\xE0m vi\u1EC7c t\u1EA1i n\u01B0\u1EDBc ngo\xE0i ho\u1EB7c c\u1EF1u thuy\u1EC1n vi\xEAn \xC2u L\u1EA1c. Gi\u1EDBi thi\u1EC7u \u0111\u1ED3ng \u0111\u1ED9i, b\u1EA1n b\xE8 gia nh\u1EADp \u0111\u1ED9i t\xE0u vi\u1EC5n d\u01B0\u01A1ng ho\u1EB7c c\xE1c ch\u01B0\u01A1ng tr\xECnh xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng \u0111\u1EC3 c\xF9ng nhau ph\xE1t tri\u1EC3n v\xE0 nh\u1EADn th\u01B0\u1EDFng x\u1EE9ng \u0111\xE1ng!",
  "home.referral.compliance": "Th\u01B0\u1EDFng do ALCM chi tr\u1EA3 100% t\u1EEB qu\u1EF9 ph\xFAc l\u1EE3i \xB7 Tuy\u1EC7t \u0111\u1ED1i kh\xF4ng tr\u1EEB l\u01B0\u01A1ng \u1EE9ng vi\xEAn theo chu\u1EA9n MLC 2006",
  "home.referral.tab.form": "1. G\u1EEDi th\xF4ng tin gi\u1EDBi thi\u1EC7u",
  "home.referral.tab.calculator": "2. T\xEDnh nhanh m\u1EE9c th\u01B0\u1EDFng",
  "home.referral.tab.policy": "3. B\u1EA3ng m\u1EE9c th\u01B0\u1EDFng chi ti\u1EBFt",
  "home.referral.tab.track": "4. Tra c\u1EE9u ti\u1EBFn \u0111\u1ED9 h\u1ED3 s\u01A1",
  "home.referral.formDescription": "\u0110i\u1EC1n th\xF4ng tin c\u1EE7a b\u1EA1n v\xE0 \u0111\u1ED3ng \u0111\u1ED9i. Ban tuy\u1EC3n d\u1EE5ng s\u1EBD li\xEAn h\u1EC7 v\xE0 c\u1EADp nh\u1EADt m\xE3 theo d\xF5i.",
  "home.referral.processingTime": "Th\u1EDDi gian x\u1EED l\xFD",
  "home.referral.processingTimeValue": "24h l\xE0m vi\u1EC7c",
  "home.referral.referrerSection": "Th\xF4ng tin Ng\u01B0\u1EDDi gi\u1EDBi thi\u1EC7u (B\u1EA1n)",
  "home.referral.referrerNameLabel": "H\u1ECD v\xE0 t\xEAn c\u1EE7a b\u1EA1n",
  "home.referral.referrerPhoneLabel": "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i / Zalo",
  "home.referral.candidateSection": "Th\xF4ng tin \u1EE8ng vi\xEAn \u0111\u01B0\u1EE3c gi\u1EDBi thi\u1EC7u",
  "home.referral.referrerStatusLabel": "T\xECnh tr\u1EA1ng c\u1EE7a b\u1EA1n",
  "home.referral.referrerStatus.0": "Thuy\u1EC1n vi\xEAn \u0111ang \u0111i t\xE0u ALCM",
  "home.referral.referrerStatus.1": "C\u1EF1u thuy\u1EC1n vi\xEAn \xC2u L\u1EA1c",
  "home.referral.referrerStatus.2": "Lao \u0111\u1ED9ng \u0111ang \u1EDF n\u01B0\u1EDBc ngo\xE0i",
  "home.referral.referrerStatus.3": "Ng\u01B0\u1EDDi th\xE2n / \u0110\u1ED1i t\xE1c t\u1EF1 do",
  "home.referral.candidateNameLabel": "H\u1ECD t\xEAn \u1EE9ng vi\xEAn",
  "home.referral.candidatePhoneLabel": "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u1EE9ng vi\xEAn",
  "home.referral.candidateRoleLabel": "V\u1ECB tr\xED b\u1EA1n mu\u1ED1n gi\u1EDBi thi\u1EC7u \u1EE9ng vi\xEAn",
  "home.referral.candidateRole.0": "Thuy\u1EC1n tr\u01B0\u1EDFng (Master) / M\xE1y tr\u01B0\u1EDFng (C/E) \u2014 Th\u01B0\u1EDFng 12.000.000 - 15.000.000\u0111",
  "home.referral.candidateRole.1": "\u0110\u1EA1i ph\xF3 (C/O) / M\xE1y hai (2/E) \u2014 Th\u01B0\u1EDFng 8.000.000 - 10.000.000\u0111",
  "home.referral.candidateRole.2": "Ph\xF3 hai, Ph\xF3 ba, M\xE1y ba, M\xE1y t\u01B0, ETO \u0110i\u1EC7n \u2014 Th\u01B0\u1EDFng 5.000.000 - 7.000.000\u0111",
  "home.referral.candidateRole.3": "Th\u1EE7y th\u1EE7 AB, Th\u1EE3 m\xE1y Oiler/Fitter, B\u1EBFp tr\u01B0\u1EDFng \u2014 Th\u01B0\u1EDFng 3.000.000 - 4.500.000\u0111",
  "home.referral.candidateRole.4": "K\u1EF9 s\u01B0 C\u01A1 kh\xED / T\u1EF1 \u0111\u1ED9ng ho\xE1 Nh\u1EADt B\u1EA3n \u2014 Th\u01B0\u1EDFng 5.000.000 - 8.000.000\u0111",
  "home.referral.candidateRole.5": "\u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn chuy\xEAn nghi\u1EC7p CHLB \u0110\u1EE9c \u2014 Th\u01B0\u1EDFng 6.000.000 - 8.000.000\u0111",
  "home.referral.candidateNotesLabel": "Ghi ch\xFA th\xEAm v\u1EC1 kinh nghi\u1EC7m / ch\u1EE9ng ch\u1EC9 c\u1EE7a b\u1EA1n b\xE8",
  "home.referral.calculator.master": "Thuy\u1EC1n tr\u01B0\u1EDFng / M\xE1y tr\u01B0\u1EDFng (~14.000.000\u0111/ng\u01B0\u1EDDi)",
  "home.referral.calculator.officer": "\u0110\u1EA1i ph\xF3, M\xE1y hai, S\u0129 quan v\u1EADn h\xE0nh (~6.500.000\u0111/ng\u01B0\u1EDDi)",
  "home.referral.calculator.rating": "Th\u1EE7y th\u1EE7 AB, Th\u1EE3 m\xE1y Oiler (~3.500.000\u0111/ng\u01B0\u1EDDi)",
  "home.referral.calculator.people": "ng\u01B0\u1EDDi",
  "home.referral.calculator.person.one": "ng\u01B0\u1EDDi",
  "home.referral.calculator.person.many": "ng\u01B0\u1EDDi",
  "home.referral.calculator.resultLabel": "M\u1EE9c th\u01B0\u1EDFng \u01B0\u1EDBc t\xEDnh c\u1EE7a b\u1EA1n",
  "home.referral.calculator.engineer": "K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n / \u0110i\u1EC1u d\u01B0\u1EE1ng \u0110\u1EE9c (~6.000.000\u0111/ng\u01B0\u1EDDi)",
  "home.referral.calculator.totalLabel": "T\u1ED5ng ti\u1EC1n th\u01B0\u1EDFng d\u1EF1 ki\u1EBFn nh\u1EADn \u0111\u01B0\u1EE3c",
  "home.referral.calculator.resultDescription": "\xC1p d\u1EE5ng cho t\u1ED5ng c\u1ED9ng {count} \u1EE9ng vi\xEAn khi h\u1ECD k\xFD h\u1EE3p \u0111\u1ED3ng v\xE0 l\xEAn t\xE0u/xu\u1EA5t c\u1EA3nh th\xE0nh c\xF4ng.",
  "home.referral.calculator.startReferral": "B\u1EAFt \u0111\u1EA7u gi\u1EDBi thi\u1EC7u ngay b\xE2y gi\u1EDD \u2192",
  "home.referral.track.search": "Tra c\u1EE9u",
  "home.referral.track.candidateLabel": "Ng\u01B0\u1EDDi \u0111\u01B0\u1EE3c gi\u1EDBi thi\u1EC7u",
  "home.referral.track.referrerLabel": "Ng\u01B0\u1EDDi gi\u1EDBi thi\u1EC7u",
  "home.referral.sample.candidateRole.0": "M\xE1y ba (3/E) T\xE0u d\u1EA7u",
  "home.referral.sample.candidateRole.1": "Th\u1EE7y th\u1EE7 AB",
  "home.referral.sample.candidateRole.2": "K\u1EF9 s\u01B0 CAD/CAM \u0111i Nh\u1EADt",
  "home.referral.sample.referrerDetail.0": "(M\xE1y 2 - T\xE0u Aulac Vanguard)",
  "home.referral.sample.referrerDetail.1": "(Th\u1EE7y th\u1EE7 AB - T\xE0u Aulac Diamond)",
  "home.referral.sample.referrerDetail.2": "(K\u1EF9 s\u01B0 c\u01A1 kh\xED - Aichi Nh\u1EADt B\u1EA3n)",
  "home.referral.sample.status.paid": "\u0110\xE3 k\xFD H\u0110 & L\xEAn t\xE0u (\u0110\xE3 duy\u1EC7t th\u01B0\u1EDFng)",
  "home.referral.sample.status.interviewing": "\u0110ang ph\u1ECFng v\u1EA5n",
  "home.referral.conditionLabel": "\u0110i\u1EC1u ki\u1EC7n:",
  "home.referral.trackingDescription": "Nh\u1EADp m\xE3 gi\u1EDBi thi\u1EC7u \u0111\xE3 nh\u1EADn sau khi g\u1EEDi h\u1ED3 s\u01A1 \u0111\u1EC3 tra c\u1EE9u tr\xEAn m\u1ECDi thi\u1EBFt b\u1ECB.",
  "home.referral.step.0.title": "G\u1EEDi th\xF4ng tin b\u1EA1n b\xE8",
  "home.referral.step.0.description": "\u0110i\u1EC1n form online ho\u1EB7c g\u1EEDi qua Zalo 0903 396 466 k\xE8m s\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u1EE9ng vi\xEAn.",
  "home.referral.step.1.title": "Th\u1EA9m \u0111\u1ECBnh & Ph\u1ECFng v\u1EA5n",
  "home.referral.step.1.description": "Kh\u1ED1i 01 ho\u1EB7c Kh\u1ED1i 03 li\xEAn h\u1EC7 \u1EE9ng vi\xEAn, ki\u1EC3m tra ch\u1EE9ng ch\u1EC9 STCW v\xE0 s\u1EAFp x\u1EBFp ph\u1ECFng v\u1EA5n.",
  "home.referral.step.2.title": "K\xFD H\u0110 & Nh\u1EADn t\xE0u / Visa",
  "home.referral.step.2.description": "\u1EE8ng vi\xEAn k\xFD h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng chu\u1EA9n MLC 2006, l\xEAn t\xE0u vi\u1EC5n d\u01B0\u01A1ng ho\u1EB7c nh\u1EADn visa xu\u1EA5t c\u1EA3nh.",
  "home.referral.step.3.title": "Chuy\u1EC3n kho\u1EA3n ti\u1EC1n th\u01B0\u1EDFng",
  "home.referral.step.3.description": "ALCM chuy\u1EC3n kho\u1EA3n tr\u1EF1c ti\u1EBFp v\xE0o t\xE0i kho\u1EA3n ng\u01B0\u1EDDi gi\u1EDBi thi\u1EC7u k\xE8m bi\xEAn nh\u1EADn minh b\u1EA1ch.",
  "home.referral.copyLink": "Sao ch\xE9p link g\u1EEDi cho b\u1EA1n b\xE8",
  "home.referral.linkCopied": "\u0110\xE3 sao ch\xE9p link gi\u1EDBi thi\u1EC7u!",
  "home.referral.addAnother": "Gi\u1EDBi thi\u1EC7u th\xEAm ng\u01B0\u1EDDi kh\xE1c",
  "home.referral.rewardCode": "M\xE3 tra c\u1EE9u th\u01B0\u1EDFng c\u1EE7a b\u1EA1n:",
  "home.referral.namePlaceholder": "VD: Tr\u1EA7n V\u0103n M\u1EA1nh",
  "home.referral.phonePlaceholder": "VD: 0918 882 199",
  "home.referral.candidateNamePlaceholder": "VD: Nguy\u1EC5n Qu\u1ED1c C\u01B0\u1EDDng",
  "home.referral.candidatePhonePlaceholder": "VD: 0903 827 111",
  "home.referral.notesPlaceholder": "VD: \u0110\xE3 t\u1EEBng \u0111i t\xE0u d\u1EA7u 30,000 DWT, c\xF3 ch\u1EE9ng ch\u1EC9 STCW II/2 c\xF2n h\u1EA1n, c\xF3 th\u1EC3 nh\u1EADn t\xE0u ngay trong th\xE1ng t\u1EDBi...",
  "home.referral.submit": "X\xE1c Nh\u1EADn Gi\u1EDBi Thi\u1EC7u & Nh\u1EADn M\xE3 Th\u01B0\u1EDFng",
  "home.referral.privacy": "Th\xF4ng tin b\u1EA3o m\u1EADt tuy\u1EC7t \u0111\u1ED1i. B\u1EA1n s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c tin nh\u1EAFn SMS/Zalo k\xE8m m\xE3 theo d\xF5i.",
  "home.referral.imageMotto": "Ch\u01B0\u01A1ng tr\xECnh \u0110\u1ED3ng \u0110\u1ED9i V\u01B0\u01A1n Kh\u01A1i",
  "home.referral.imageMottoLine": "\u0110o\xE0n K\u1EBFt \xB7 V\u01B0\u01A1n Kh\u01A1i \xB7 C\xF9ng Ph\xE1t Tri\u1EC3n",
  "home.referral.benefit.paidTitle": "Chi tr\u1EA3 minh b\u1EA1ch:",
  "home.referral.benefit.paidDescription": "Ti\u1EC1n th\u01B0\u1EDFng \u0111\u01B0\u1EE3c chuy\u1EC3n kho\u1EA3n th\u1EB3ng v\xE0o t\xE0i kho\u1EA3n ng\xE2n h\xE0ng c\u1EE7a b\u1EA1n ngay khi thuy\u1EC1n vi\xEAn k\xFD h\u1EE3p \u0111\u1ED3ng v\xE0 ho\xE0n t\u1EA5t l\xEAn t\xE0u (sign-on).",
  "home.referral.benefit.unlimitedTitle": "Kh\xF4ng gi\u1EDBi h\u1EA1n s\u1ED1 l\u01B0\u1EE3t:",
  "home.referral.benefit.unlimitedDescription": "B\u1EA1n c\xF3 th\u1EC3 gi\u1EDBi thi\u1EC7u nhi\u1EC1u \u0111\u1ED3ng \u0111\u1ED9i c\xF9ng l\xFAc, m\u1EE9c th\u01B0\u1EDFng \u0111\u01B0\u1EE3c c\u1ED9ng d\u1ED3n l\u0169y ti\u1EBFn.",
  "home.referral.benefit.mlcTitle": "\u0110\u1EA3m b\u1EA3o chu\u1EA9n MLC 2006:",
  "home.referral.benefit.mlcDescription": "B\u1EA1n b\xE8 c\u1EE7a b\u1EA1n \u0111\u01B0\u1EE3c h\u01B0\u1EDFng \u0111\u1EA7y \u0111\u1EE7 quy\u1EC1n l\u1EE3i, h\u1EE3p \u0111\u1ED3ng l\u01B0\u01A1ng cao minh b\u1EA1ch, kh\xF4ng m\u1EA5t b\u1EA5t k\u1EF3 kho\u1EA3n ph\xED m\xF4i gi\u1EDBi b\u1EA5t h\u1EE3p ph\xE1p n\xE0o.",
  "home.referral.dutyContact": "Tr\u1EF1c ban Tuy\u1EC3n d\u1EE5ng & Gi\u1EDBi thi\u1EC7u",
  "home.referral.callNow": "G\u1ECDi ngay",
  "home.referral.calculatorEyebrow": "C\xF4ng c\u1EE5 \u01AF\u1EDBc T\xEDnh Ti\u1EC1n Th\u01B0\u1EDFng Gi\u1EDBi Thi\u1EC7u",
  "home.referral.calculatorDescription": "Ch\u1ECDn s\u1ED1 l\u01B0\u1EE3ng b\u1EA1n b\xE8 v\xE0 ch\u1EE9c danh b\u1EA1n d\u1EF1 \u0111\u1ECBnh gi\u1EDBi thi\u1EC7u \u0111\u1EC3 h\u1EC7 th\u1ED1ng \u01B0\u1EDBc t\xEDnh s\u1ED1 ti\u1EC1n hoa h\u1ED3ng th\u1EF1c nh\u1EADn.",
  "home.referral.trackingPlaceholder": "Nh\u1EADp m\xE3 gi\u1EDBi thi\u1EC7u...",
  "home.events.eyebrow": "L\u1ECBch Ph\u1ECFng V\u1EA5n Tuy\u1EC3n Ch\u1ECDn & Ng\xE0y H\u1ED9i H\u01B0\u1EDBng Nghi\u1EC7p",
  "home.events.description": "G\u1EB7p g\u1EE1 tr\u1EF1c ti\u1EBFp ch\u1EE7 t\xE0u qu\u1ED1c t\u1EBF (Nh\u1EADt B\u1EA3n, Singapore, H\xE0n Qu\u1ED1c) v\xE0 \u0111\u1EA1i di\u1EC7n nghi\u1EC7p \u0111o\xE0n lao \u0111\u1ED9ng \u0110\u1EE9c. \u0110\u0103ng k\xFD gi\u1EEF ch\u1ED7 mi\u1EC5n ph\xED \u0111\u1EC3 nh\u1EADn t\u01B0 v\u1EA5n 1:1, ki\u1EC3m tra ti\u1EBFng Anh h\xE0ng h\u1EA3i v\xE0 th\u1EA9m \u0111\u1ECBnh ch\u1EE9ng ch\u1EC9 t\u1EA1i ch\u1ED7.",
  "home.events.myTickets": "V\xE9 c\u1EE7a t\xF4i ({count})",
  "home.events.view.cards": "D\u1EA1ng Th\u1EBB Chi Ti\u1EBFt",
  "home.events.view.timeline": "D\u1EA1ng L\u1ECBch Tr\xECnh",
  "home.events.searchPlaceholder": "T\xECm theo t\xEAn ch\u1EE7 t\xE0u, lo\u1EA1i t\xE0u, ch\u1EE9c danh (VD: Daiichi Chuo, K\u1EF9 s\u01B0 Nh\u1EADt, T\xE0u d\u1EA7u...)",
  "home.events.locationLabel": "H\xECnh th\u1EE9c:",
  "home.events.location.all": "T\u1EA5t c\u1EA3 h\xECnh th\u1EE9c",
  "home.events.location.onsite": "Tr\u1EF1c ti\u1EBFp t\u1EA1i Tr\u1EE5 s\u1EDF TP.HCM",
  "home.events.location.online": "Tr\u1EF1c tuy\u1EBFn (Zoom / Meet)",
  "home.events.type.all": "T\u1EA5t c\u1EA3 s\u1EF1 ki\u1EC7n ({count})",
  "home.events.type.crew": "Ph\u1ECFng v\u1EA5n Thuy\u1EC1n vi\xEAn ({count})",
  "home.events.type.engineer": "H\u1ED9i th\u1EA3o K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n ({count})",
  "home.events.type.study": "\u0110i\u1EC1u d\u01B0\u1EE1ng & Du h\u1ECDc \u0110\u1EE9c ({count})",
  "home.events.type.stcw": "L\u1EDBp b\u1ED3i d\u01B0\u1EE1ng STCW ({count})",
  "home.events.addCalendar": "Th\xEAm v\xE0o Google Calendar",
  "home.events.registered": "\u0110\xE3 c\xF3 v\xE9 tham gia (Xem v\xE9)",
  "home.events.registerFree": "\u0110\u0103ng K\xFD Tham Gia Mi\u1EC5n Ph\xED",
  "home.events.remoteNotice": "Thuy\u1EC1n vi\xEAn \u0111ang \u0111i t\xE0u c\xF3 th\u1EC3 \u0111\u0103ng k\xFD tr\u1EF1c tuy\u1EBFn.",
  "home.events.timeLabel": "Th\u1EDDi gian:",
  "home.events.locationDetailLabel": "\u0110\u1ECBa \u0111i\u1EC3m:",
  "home.events.namePlaceholder": "VD: Nguy\u1EC5n V\u0103n Nam",
  "home.events.phonePlaceholder": "VD: 0903 123 456",
  "home.events.questionPlaceholder": "VD: Ch\u1EBF \u0111\u1ED9 ph\u1EE5 c\u1EA5p vetting t\xE0u d\u1EA7u, ti\xEAu chu\u1EA9n ti\u1EBFng Anh ph\u1ECFng v\u1EA5n...",
  "home.events.onsiteLabel": "Tr\u1EF1c ti\u1EBFp t\u1EA1i Tr\u1EE5 s\u1EDF TP.HCM",
  "home.events.onlineLabel": "Tr\u1EF1c tuy\u1EBFn Zoom Meeting",
  "home.events.freeNotice": "Tham gia ho\xE0n to\xE0n mi\u1EC5n ph\xED. ALCM kh\xF4ng thu b\u1EA5t k\u1EF3 kho\u1EA3n ph\xED t\u1ED5 ch\u1EE9c n\xE0o.",
  "home.events.submitRegistration": "G\u1EEDi \u0111\u0103ng k\xFD tham gia",
  "home.events.myTicketsTitle": "Danh S\xE1ch V\xE9 S\u1EF1 Ki\u1EC7n C\u1EE7a B\u1EA1n ({count})",
  "home.events.modal.ticketTitle": "V\xE9 M\u1EDDi \u0110i\u1EC7n T\u1EED (E-Ticket Pass)",
  "home.events.modal.registerTitle": "\u0110\u0103ng K\xFD Tham Gia S\u1EF1 Ki\u1EC7n Mi\u1EC5n Ph\xED",
  "home.events.modal.support": "\xC2u L\u1EA1c Crew Manning \xB7 H\u1ED7 tr\u1EE3 t\u01B0 v\u1EA5n 1:1 c\xF9ng chuy\xEAn gia",
  "home.events.ticket.header": "TH\u1EBA X\xC1C NH\u1EACN THAM GIA PH\u1ECENG V\u1EA4N & H\u1ED8I TH\u1EA2O",
  "home.events.ticket.attendee": "H\u1ECD t\xEAn ng\u01B0\u1EDDi tham d\u1EF1:",
  "home.events.ticket.code": "M\xE3 v\xE9 \u0111i\u1EC7n t\u1EED:",
  "home.events.ticket.eventTime": "Th\u1EDDi gian di\u1EC5n ra:",
  "home.events.ticket.attendanceMode": "H\xECnh th\u1EE9c tham d\u1EF1:",
  "home.events.ticket.onsite": "Tr\u1EF1c ti\u1EBFp t\u1EA1i Tr\u1EE5 s\u1EDF",
  "home.events.ticket.online": "Tr\u1EF1c tuy\u1EBFn Zoom/Meet",
  "home.events.ticket.location": "\u0110\u1ECBa \u0111i\u1EC3m:",
  "home.events.ticket.successTitle": "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng!",
  "home.events.ticket.successDescription": "Ban tuy\u1EC3n d\u1EE5ng ALCM \u0111\xE3 ghi nh\u1EADn th\xF4ng tin v\xE0 s\u1EBD g\u1EEDi tin nh\u1EAFn SMS/Zalo nh\u1EAFc l\u1ECBch tr\u01B0\u1EDBc 24 gi\u1EDD di\u1EC5n ra s\u1EF1 ki\u1EC7n.",
  "home.events.ticket.finish": "Ho\xE0n t\u1EA5t & \u0110\xF3ng",
  "home.events.registration.eventLabel": "S\u1EF1 ki\u1EC7n b\u1EA1n \u0111ang \u0111\u0103ng k\xFD:",
  "home.events.registration.fullName": "H\u1ECD v\xE0 t\xEAn c\u1EE7a b\u1EA1n",
  "home.events.registration.fullNamePlaceholder": "VD: Nguy\u1EC5n V\u0103n Nam",
  "home.events.registration.phone": "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i / Zalo",
  "home.events.registration.phonePlaceholder": "VD: 0903 123 456",
  "home.events.registration.email": "Email nh\u1EADn th\u01B0 m\u1EDDi (t\xF9y ch\u1ECDn)",
  "home.events.registration.confirmBooking": "X\xE1c Nh\u1EADn Gi\u1EEF Ch\u1ED7 & L\u1EA5y M\xE3 V\xE9",
  "home.events.registration.currentRole": "Ch\u1EE9c danh / Ngh\u1EC1 nghi\u1EC7p hi\u1EC7n t\u1EA1i",
  "home.events.registration.role.master": "Thuy\u1EC1n tr\u01B0\u1EDFng / M\xE1y tr\u01B0\u1EDFng",
  "home.events.registration.role.officer": "S\u0129 quan boong / S\u0129 quan m\xE1y",
  "home.events.registration.role.rating": "Th\u1EE7y th\u1EE7 AB / Th\u1EE3 m\xE1y Oiler",
  "home.events.registration.role.engineer": "K\u1EF9 s\u01B0 C\u01A1 kh\xED / T\u1EF1 \u0111\u1ED9ng ho\xE1",
  "home.events.registration.role.student": "Sinh vi\xEAn n\u0103m cu\u1ED1i ng\xE0nh H\xE0ng h\u1EA3i",
  "home.events.registration.role.study": "\u1EE8ng vi\xEAn \u0110i\u1EC1u d\u01B0\u1EE1ng / Du h\u1ECDc \u0110\u1EE9c",
  "home.events.registration.role.other": "Kh\xE1c",
  "home.events.registration.onsite": "Tr\u1EF1c ti\u1EBFp t\u1EA1i Tr\u1EE5 s\u1EDF TP.HCM",
  "home.events.registration.online": "Tr\u1EF1c tuy\u1EBFn Zoom Meeting",
  "home.events.registration.freeNotice": "Tham gia ho\xE0n to\xE0n MI\u1EC4N PH\xCD. ALCM kh\xF4ng thu b\u1EA5t k\u1EF3 kho\u1EA3n ph\xED t\u1ED5 ch\u1EE9c n\xE0o.",
  "home.events.registration.submit": "G\u1EEDi \u0111\u0103ng k\xFD tham gia",
  "home.events.tickets.time": "Th\u1EDDi gian:",
  "home.events.tickets.location": "\u0110\u1ECBa \u0111i\u1EC3m:"
};
var TOPBAR_COPY_DEFAULTS = {
  vi: {
    "topbar.about.label": "V\u1EC1 ALCM",
    "topbar.about.description": "H\u1ED3 s\u01A1 n\u0103ng l\u1EF1c, gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng & ban l\xE3nh \u0111\u1EA1o \xC2u L\u1EA1c Crew Manning",
    "topbar.about.vision": "T\u1EA7m nh\xECn & Cam k\u1EBFt",
    "topbar.about.services": "Gi\u1EDBi thi\u1EC7u d\u1ECBch v\u1EE5",
    "topbar.about.facilities": "C\u01A1 s\u1EDF v\u1EADt ch\u1EA5t",
    "topbar.about.resources": "C\u01A1 s\u1EDF ngu\u1ED3n l\u1EF1c",
    "topbar.about.representatives": "\u0110\u1EA1i di\u1EC7n \u1EDF n\u01B0\u1EDBc ngo\xE0i",
    "topbar.news.label": "Tin t\u1EE9c",
    "topbar.news.description": "C\u1EADp nh\u1EADt tin t\u1EE9c th\u1ECB tr\u01B0\u1EDDng h\xE0ng h\u1EA3i, vi\u1EC7c l\xE0m v\xE0 \u0111\xE0o t\u1EA1o",
    "topbar.hotline.label": "Hotline:",
    "topbar.hotline.number": "0903 396 466",
    "topbar.mlc.label": "Chu\u1EA9n MLC 2006",
    "topbar.language.label": "Ch\u1ECDn ng\xF4n ng\u1EEF"
  },
  en: {
    "topbar.about.label": "About ALCM",
    "topbar.about.description": "Company profile, official licenses & leadership of Au Lac Crew Manning",
    "topbar.about.vision": "Vision & Commitments",
    "topbar.about.services": "Our Services",
    "topbar.about.facilities": "Facilities",
    "topbar.about.resources": "Our People & Resources",
    "topbar.about.representatives": "Overseas Representatives",
    "topbar.news.label": "News",
    "topbar.news.description": "Maritime market updates, job vacancies and professional training news",
    "topbar.hotline.label": "Hotline:",
    "topbar.hotline.number": "0903 396 466",
    "topbar.mlc.label": "MLC 2006 Certified",
    "topbar.language.label": "Select Language"
  },
  zh: {
    "topbar.about.label": "\u5173\u4E8EALCM",
    "topbar.about.description": "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u516C\u53F8\u7B80\u4ECB\u3001\u7ECF\u8425\u8BB8\u53EF\u4E0E\u9886\u5BFC\u56E2\u961F",
    "topbar.about.vision": "\u613F\u666F\u4E0E\u627F\u8BFA",
    "topbar.about.services": "\u670D\u52A1\u4ECB\u7ECD",
    "topbar.about.facilities": "\u8BBE\u65BD\u4E0E\u573A\u5730",
    "topbar.about.resources": "\u4EBA\u624D\u4E0E\u8D44\u6E90",
    "topbar.about.representatives": "\u6D77\u5916\u4EE3\u8868",
    "topbar.news.label": "\u65B0\u95FB\u8D44\u8BAF",
    "topbar.news.description": "\u6D77\u4E8B\u5E02\u573A\u3001\u804C\u4F4D\u62DB\u8058\u4E0E\u4E13\u4E1A\u57F9\u8BAD\u52A8\u6001",
    "topbar.hotline.label": "\u670D\u52A1\u70ED\u7EBF:",
    "topbar.hotline.number": "0903 396 466",
    "topbar.mlc.label": "\u7B26\u5408MLC 2006\u6807\u51C6",
    "topbar.language.label": "\u9009\u62E9\u8BED\u8A00"
  }
};
var MAINMENU_COPY_DEFAULTS = {
  vi: {
    "mainmenu.home": "Trang ch\u1EE7",
    "mainmenu.export.label": "Xu\u1EA5t kh\u1EA9u ngu\u1ED3n l\u1EF1c",
    "mainmenu.export.title": "Kh\u1ED1i Xu\u1EA5t kh\u1EA9u ngu\u1ED3n nh\xE2n l\u1EF1c",
    "mainmenu.export.market.japan": "Nh\u1EADt B\u1EA3n",
    "mainmenu.export.market.germany": "\u0110\u1EE9c",
    "mainmenu.export.market.korea": "H\xE0n Qu\u1ED1c",
    "mainmenu.offshore.label": "D\u1ECBch v\u1EE5 Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn",
    "mainmenu.offshore.title": "D\u1ECBch v\u1EE5 ngo\xE0i kh\u01A1i & cung \u1EE9ng thuy\u1EC1n vi\xEAn",
    "mainmenu.offshore.crew": "Cung \u1EE9ng thuy\u1EC1n vi\xEAn",
    "mainmenu.training.label": "\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    "mainmenu.training.title": "\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n",
    "mainmenu.training.process": "Quy tr\xECnh tuy\u1EC3n ch\u1ECDn",
    "mainmenu.study.label": "T\u01B0 v\u1EA5n du h\u1ECDc",
    "mainmenu.study.title": "T\u01B0 v\u1EA5n du h\u1ECDc \xC2u L\u1EA1c",
    "mainmenu.study.advisory": "T\u01B0 v\u1EA5n du h\u1ECDc",
    "mainmenu.projects.label": "D\u1EF1 \xE1n & Th\u01B0\u1EDFng",
    "mainmenu.projects.title": "D\u1EF1 \xE1n tuy\u1EC3n d\u1EE5ng & Th\u01B0\u1EDFng gi\u1EDBi thi\u1EC7u",
    "mainmenu.projects.referral": "Th\u01B0\u1EDFng 15 tri\u1EC7u"
  },
  en: {
    "mainmenu.home": "Home",
    "mainmenu.export.label": "Overseas Human Resources",
    "mainmenu.export.title": "Human Resource Export Division",
    "mainmenu.export.market.japan": "Japan",
    "mainmenu.export.market.germany": "Germany",
    "mainmenu.export.market.korea": "South Korea",
    "mainmenu.offshore.label": "Offshore Services & Crew Manning",
    "mainmenu.offshore.title": "Offshore Services & Crew Manning",
    "mainmenu.offshore.crew": "Crew Manning",
    "mainmenu.training.label": "Maritime Training & Education",
    "mainmenu.training.title": "Maritime Training & Education",
    "mainmenu.training.process": "Recruitment Process",
    "mainmenu.study.label": "Study Abroad Center",
    "mainmenu.study.title": "Au Lac Study Abroad Center",
    "mainmenu.study.advisory": "Study Abroad Advisory",
    "mainmenu.projects.label": "Projects & Rewards",
    "mainmenu.projects.title": "Recruitment Projects & Referral Rewards",
    "mainmenu.projects.referral": "Rewards up to VND 15 million"
  },
  zh: {
    "mainmenu.home": "\u9996\u9875",
    "mainmenu.export.label": "\u6D77\u5916\u4EBA\u529B\u8D44\u6E90",
    "mainmenu.export.title": "\u4EBA\u529B\u8D44\u6E90\u5916\u6D3E\u4E8B\u4E1A\u90E8",
    "mainmenu.export.market.japan": "\u65E5\u672C",
    "mainmenu.export.market.germany": "\u5FB7\u56FD",
    "mainmenu.export.market.korea": "\u97E9\u56FD",
    "mainmenu.offshore.label": "\u6D77\u6D0B\u670D\u52A1\u4E0E\u8239\u5458\u6D3E\u9063",
    "mainmenu.offshore.title": "\u6D77\u6D0B\u670D\u52A1\u4E0E\u8239\u5458\u6D3E\u9063",
    "mainmenu.offshore.crew": "\u8239\u5458\u6D3E\u9063",
    "mainmenu.training.label": "\u6D77\u4E8B\u57F9\u8BAD\u4E0E\u6559\u80B2",
    "mainmenu.training.title": "\u6D77\u4E8B\u57F9\u8BAD\u4E0E\u6559\u80B2",
    "mainmenu.training.process": "\u62DB\u8058\u6D41\u7A0B",
    "mainmenu.study.label": "\u7559\u5B66\u54A8\u8BE2\u4E2D\u5FC3",
    "mainmenu.study.title": "\u6B27\u4E50\u7559\u5B66\u54A8\u8BE2\u4E2D\u5FC3",
    "mainmenu.study.advisory": "\u7559\u5B66\u54A8\u8BE2",
    "mainmenu.projects.label": "\u62DB\u8058\u9879\u76EE\u4E0E\u63A8\u8350\u5956\u52B1",
    "mainmenu.projects.title": "\u62DB\u8058\u9879\u76EE\u4E0E\u63A8\u8350\u5956\u52B1",
    "mainmenu.projects.referral": "\u6700\u9AD81,500\u4E07\u8D8A\u5357\u76FE\u5956\u52B1"
  }
};
for (const language of ["vi", "en", "zh"]) {
  TRANSLATIONS[language].siteCopy = {
    ...TRANSLATIONS[language].siteCopy || {},
    ...TOPBAR_COPY_DEFAULTS[language],
    ...MAINMENU_COPY_DEFAULTS[language]
  };
}
TRANSLATIONS.vi.siteCopy = {
  ...TRANSLATIONS.vi.siteCopy || {},
  ...ROUTE_UI_COPY_DEFAULTS
};
function replaceTranslations(translations) {
  TRANSLATIONS = translations;
}
var LanguageContext = createContext(void 0);

// src/data/aboutPageContent.ts
var ABOUT_PAGE_COPY = {
  vi: {
    heroEyebrow: "H\u1ED3 S\u01A1 Doanh Nghi\u1EC7p & H\u1EC7 Sinh Th\xE1i \xC2u L\u1EA1c",
    heroTitle: "Gi\u1EDBi Thi\u1EC7u C\xF4ng Ty C\u1ED5 Ph\u1EA7n \xC2u L\u1EA1c Crew Manning",
    heroDescription: "Th\xE0nh vi\xEAn h\u1EC7 sinh th\xE1i v\u1EADn t\u1EA3i bi\u1EC3n \xC2u L\u1EA1c (aulac.com.vn). Ti\xEAn phong cung \u1EE9ng thuy\u1EC1n vi\xEAn \u0111\u1EA1t chu\u1EA9n MLC 2006, xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng ch\u1EA5t l\u01B0\u1EE3ng cao v\xE0 \u0111\xE0o t\u1EA1o nghi\u1EC7p v\u1EE5 chu\u1EA9n qu\u1ED1c t\u1EBF.",
    sections: ["T\u1EA7m nh\xECn & Cam k\u1EBFt", "Gi\u1EDBi thi\u1EC7u d\u1ECBch v\u1EE5", "C\u01A1 s\u1EDF v\u1EADt ch\u1EA5t", "C\u01A1 s\u1EDF ngu\u1ED3n l\u1EF1c", "\u0110\u1EA1i di\u1EC7n \u1EDF n\u01B0\u1EDBc ngo\xE0i"],
    vision: {
      eyebrow: "Ph\xE1p nh\xE2n & Qu\u1EA3n tr\u1ECB minh b\u1EA1ch",
      title: "V\u1EC1 C\xF4ng Ty C\u1ED5 Ph\u1EA7n \xC2u L\u1EA1c Crew Manning",
      summary: "Th\xE0nh vi\xEAn h\u1EC7 sinh th\xE1i v\u1EADn t\u1EA3i bi\u1EC3n \xC2u L\u1EA1c, ho\u1EA1t \u0111\u1ED9ng chuy\xEAn nghi\u1EC7p trong l\u0129nh v\u1EF1c cung \u1EE9ng ngu\u1ED3n nh\xE2n l\u1EF1c h\xE0ng h\u1EA3i v\xE0 xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng ch\u1EA5t l\u01B0\u1EE3ng cao.",
      profileParagraphs: [
        "C\xF4ng ty C\u1ED5 ph\u1EA7n \xC2u L\u1EA1c Crew Manning (ALCM) ho\u1EA1t \u0111\u1ED9ng theo gi\u1EA5y ch\u1EE9ng nh\u1EADn \u0111\u0103ng k\xFD doanh nghi\u1EC7p s\u1ED1 0317391467 do S\u1EDF K\u1EBF ho\u1EA1ch v\xE0 \u0110\u1EA7u t\u01B0 TP.HCM c\u1EA5p ng\xE0y 21/7/2022.",
        "Xu\u1EA5t ph\xE1t t\u1EEB nhu c\u1EA7u qu\u1EA3n l\xFD thuy\u1EC1n b\u1ED9 cho \u0111\u1ED9i t\xE0u v\u1EADn t\u1EA3i d\u1EA7u kh\xED vi\u1EC5n d\u01B0\u01A1ng c\u1EE7a T\u1EADp \u0111o\xE0n \xC2u L\u1EA1c, ALCM \u0111\xE3 m\u1EDF r\u1ED9ng th\xE0nh \u0111\u01A1n v\u1ECB cung \u1EE9ng nh\xE2n l\u1EF1c qu\u1ED1c t\u1EBF uy t\xEDn, ph\u1EE5c v\u1EE5 c\xE1c ch\u1EE7 t\xE0u t\u1EA1i Nh\u1EADt B\u1EA3n, H\xE0n Qu\u1ED1c, Singapore, \u0110\xE0i Loan v\xE0 \u0111\u01B0a lao \u0111\u1ED9ng tay ngh\u1EC1 cao sang l\xE0m vi\u1EC7c t\u1EA1i \u0110\u1EE9c.",
        "V\u1EDBi m\xF4 h\xECnh 5 kh\u1ED1i chuy\xEAn m\xF4n kh\xE9p k\xEDn, ALCM t\u1EF1 ch\u1EE7 t\u1EEB kh\xE2u tuy\u1EC3n ch\u1ECDn, hu\u1EA5n luy\u1EC7n an to\xE0n STCW m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i, b\u1ED3i d\u01B0\u1EE1ng ngo\u1EA1i ng\u1EEF v\xE0 \u1EE9ng d\u1EE5ng AI \u0111\u1EBFn kh\xE2u \u0111\xF3n t\xE0u v\xE0 h\u1ED7 tr\u1EE3 h\u1ED3i h\u01B0\u01A1ng sau khi k\u1EBFt th\xFAc h\u1EE3p \u0111\u1ED3ng."
      ],
      stats: [
        { label: "Th\xE0nh l\u1EADp", value: "21/07/2022" },
        { label: "M\xE3 s\u1ED1 thu\u1EBF", value: "0317391467" },
        { label: "H\u1EC7 th\u1ED1ng QLCL", value: "ISO 9001:2015" },
        { label: "C\xF4ng \u01B0\u1EDBc H\xE0ng h\u1EA3i", value: "MLC 2006 (SRPS)" }
      ],
      licensesTitle: "Ch\u1EE9ng nh\u1EADn & Gi\u1EA5y ph\xE9p ph\xE1p l\xFD",
      licenseCards: [
        { title: "Gi\u1EA5y ch\u1EE9ng nh\u1EADn SRPS (MLC 2006)", description: "\u0110\u1EA1t chu\u1EA9n Ti\xEAu chu\u1EA9n A1.4 v\u1EC1 D\u1ECBch v\u1EE5 Tuy\u1EC3n d\u1EE5ng v\xE0 Cung \u1EE9ng Thuy\u1EC1n vi\xEAn c\u1EE7a T\u1ED5 ch\u1EE9c Lao \u0111\u1ED9ng Qu\u1ED1c t\u1EBF (ILO)." },
        { title: "H\u1EC7 th\u1ED1ng qu\u1EA3n l\xFD ch\u1EA5t l\u01B0\u1EE3ng ISO 9001:2015", description: "\u0110\u01B0\u1EE3c \u0111\xE1nh gi\xE1 v\xE0 ch\u1EE9ng nh\u1EADn \u0111\u1ECBnh k\u1EF3 b\u1EDFi t\u1ED5 ch\u1EE9c gi\xE1m \u0111\u1ECBnh qu\u1ED1c t\u1EBF \u0111\u1ED9c l\u1EADp." },
        { title: "Gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng \u0111\u01B0a ng\u01B0\u1EDDi lao \u0111\u1ED9ng \u0111i l\xE0m vi\u1EC7c \u1EDF n\u01B0\u1EDBc ngo\xE0i", description: "\u0110\u1EA7y \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n ph\xE1p l\xFD th\u1EF1c hi\u1EC7n c\xE1c h\u1EE3p \u0111\u1ED3ng cung \u1EE9ng lao \u0111\u1ED9ng theo Lu\u1EADt s\u1ED1 69/2020/QH14." }
      ]
    },
    facilityTitle: "M\u1EB7t b\u1EB1ng c\xF4ng n\u0103ng",
    facilityDescription: "B\u1ED1 tr\xED c\xE1c ph\xF2ng nghi\u1EC7p v\u1EE5, khu \u0111\xE0o t\u1EA1o v\xE0 kh\xF4ng gian th\u1EF1c t\u1EADp ngo\xE0i tr\u1EDDi.",
    facilityAlt: "S\u01A1 \u0111\u1ED3 m\u1EB7t b\u1EB1ng c\xF4ng n\u0103ng tr\u1EE5 s\u1EDF v\xE0 khu \u0111\xE0o t\u1EA1o \xC2u L\u1EA1c Crew Manning",
    roomSignTitles: ["B\u1EA3ng t\xEAn ph\xF2ng nghi\u1EC7p v\u1EE5 (Ph\xF2ng 01\u201306)", "B\u1EA3ng t\xEAn c\xE1c ph\xF2ng h\u1ECDc (Ph\xF2ng 07\u201312)"],
    roomSignDescriptions: ["B\u1ED9 nh\u1EADn di\u1EC7n c\xE1c ph\xF2ng \u0111i\u1EC1u h\xE0nh, h\u1ED9i th\u1EA3o, s\u01A1 c\u1EE9u v\xE0 d\u1ECBch v\u1EE5 ngo\xE0i kh\u01A1i.", "C\xE1c b\u1EA3ng ch\u1EC9 d\u1EABn ph\xF2ng h\u1ECDc ph\u1EE5c v\u1EE5 c\xF4ng t\xE1c \u0111\xE0o t\u1EA1o v\xE0 hu\u1EA5n luy\u1EC7n."],
    representativesDescription: "K\u1EBFt n\u1ED1i v\xE0 h\u1ED7 tr\u1EE3 \u0111\u1ED1i t\xE1c, \u1EE9ng vi\xEAn t\u1EA1i c\xE1c th\u1ECB tr\u01B0\u1EDDng qu\u1ED1c t\u1EBF tr\u1ECDng \u0111i\u1EC3m.",
    countries: ["C\u1ED9ng h\xF2a S\xE9c", "Hungary", "V\u01B0\u01A1ng qu\u1ED1c Anh", "Hoa K\u1EF3"],
    orgChartTitle: "S\u01A0 \u0110\u1ED2 C\u01A0 C\u1EA4U T\u1ED4 CH\u1EE8C C\xD4NG TY",
    governanceTitle: "M\xF4 H\xECnh Qu\u1EA3n Tr\u1ECB Chu\u1EA9n Doanh Nghi\u1EC7p C\u1ED5 Ph\u1EA7n",
    orgChartDescription: "Ph\xE2n quy\u1EC1n r\xF5 r\xE0ng, c\xF3 Ban ki\u1EC3m so\xE1t \u0111\u1ED9c l\u1EADp v\xE0 \u0110\u1EA1i di\u1EC7n l\xE3nh \u0111\u1EA1o ch\u1EA5t l\u01B0\u1EE3ng ISO \xB7 MLC chuy\xEAn tr\xE1ch."
  },
  en: {
    heroEyebrow: "Corporate Profile & Au Lac Ecosystem",
    heroTitle: "Au Lac Crew Manning Joint Stock Company",
    heroDescription: "A member of the Au Lac maritime ecosystem, specializing in MLC 2006-compliant crew supply, quality overseas employment, and internationally aligned professional training.",
    sections: ["Vision & Commitments", "Our Services", "Facilities", "Our People & Resources", "Overseas Representatives"],
    vision: {
      eyebrow: "Corporate governance & transparency",
      title: "About Au Lac Crew Manning Joint Stock Company",
      summary: "A professional member of the Au Lac maritime ecosystem, specializing in high-quality seafarer recruitment and international labour export.",
      profileParagraphs: [
        "Au Lac Crew Manning Joint Stock Company (ALCM) is registered under business certificate no. 0317391467 issued by the Ho Chi Minh City Department of Planning and Investment on 21/07/2022.",
        "Born from the need to manage offshore vessel crews for the Au Lac Group, ALCM has expanded into a trusted international manpower provider serving shipowners in Japan, South Korea, Singapore, Taiwan, and skilled workers in Germany.",
        "With a closed-loop five-division model, ALCM controls the full cycle from recruitment and STCW safety training with bridge simulation to vessel onboarding and post-contract reintegration support."
      ],
      stats: [
        { label: "Established", value: "21/07/2022" },
        { label: "Tax code", value: "0317391467" },
        { label: "Quality system", value: "ISO 9001:2015" },
        { label: "Maritime convention", value: "MLC 2006 (SRPS)" }
      ],
      licensesTitle: "Licenses & legal certifications",
      licenseCards: [
        { title: "SRPS certification (MLC 2006)", description: "Compliant with ILO Standard A1.4 for Recruitment and Placement Services for Seafarers." },
        { title: "Quality management system ISO 9001:2015", description: "Reviewed and certified regularly by an independent international auditor." },
        { title: "Overseas labour export operating license", description: "Legally authorized to execute labour supply contracts under Law 69/2020/QH14." }
      ]
    },
    facilityTitle: "Facility layout",
    facilityDescription: "Office rooms, training facilities and outdoor practice areas.",
    facilityAlt: "Au Lac Crew Manning office and training facility floor plan",
    roomSignTitles: ["Office and service room signs (Rooms 01\u201306)", "Classroom signs (Rooms 07\u201312)"],
    roomSignDescriptions: ["Room signs for operations, meetings, first aid, and offshore services.", "Room signs for training and classroom spaces."],
    representativesDescription: "Connecting with partners and supporting candidates in key international markets.",
    countries: ["Czech Republic", "Hungary", "United Kingdom", "United States"],
    orgChartTitle: "COMPANY ORGANIZATION CHART",
    governanceTitle: "Professional Corporate Governance Model",
    orgChartDescription: "Clear governance, independent oversight, and quality leadership aligned with ISO and MLC standards."
  },
  ja: {
    heroEyebrow: "\u4F01\u696D\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u30FBAu Lac\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0",
    heroTitle: "Au Lac Crew Manning\u682A\u5F0F\u4F1A\u793E\u306E\u3054\u7D39\u4ECB",
    heroDescription: "Au Lac\u6D77\u904B\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0\u306E\u4E00\u54E1\u3068\u3057\u3066\u3001MLC 2006\u57FA\u6E96\u306E\u8239\u54E1\u6D3E\u9063\u3001\u8CEA\u306E\u9AD8\u3044\u6D77\u5916\u5C31\u52B4\u652F\u63F4\u3001\u56FD\u969B\u57FA\u6E96\u306B\u6CBF\u3063\u305F\u5C02\u9580\u6559\u80B2\u3092\u63D0\u4F9B\u3057\u3066\u3044\u307E\u3059\u3002",
    sections: ["\u30D3\u30B8\u30E7\u30F3\u3068\u53D6\u308A\u7D44\u307F", "\u30B5\u30FC\u30D3\u30B9\u7D39\u4ECB", "\u65BD\u8A2D\u30FB\u8A2D\u5099", "\u4EBA\u6750\u3068\u4F53\u5236", "\u6D77\u5916\u62E0\u70B9"],
    vision: {
      eyebrow: "\u4F01\u696D\u7D71\u6CBB\u3068\u900F\u660E\u6027",
      title: "Au Lac Crew Manning\u682A\u5F0F\u4F1A\u793E\u306B\u3064\u3044\u3066",
      summary: "Au Lac\u6D77\u904B\u30A8\u30B3\u30B7\u30B9\u30C6\u30E0\u306E\u4E00\u54E1\u3068\u3057\u3066\u3001\u9AD8\u54C1\u8CEA\u306A\u8239\u54E1\u63A1\u7528\u3068\u6D77\u5916\u4EBA\u6750\u6D3E\u9063\u306B\u7279\u5316\u3057\u3066\u3044\u307E\u3059\u3002",
      profileParagraphs: [
        "Au Lac Crew Manning\u682A\u5F0F\u4F1A\u793E\uFF08ALCM\uFF09\u306F\u30012022\u5E747\u670821\u65E5\u306B\u30DB\u30FC\u30C1\u30DF\u30F3\u5E02\u6295\u8CC7\u8A08\u753B\u5C40\u3088\u308A\u767A\u884C\u3055\u308C\u305F\u4E8B\u696D\u767B\u9332\u8A3C\u660E\u66F8\u7B2C0317391467\u53F7\u306B\u57FA\u3065\u304D\u55B6\u696D\u3057\u3066\u3044\u307E\u3059\u3002",
        "Au Lac\u30B0\u30EB\u30FC\u30D7\u306E\u6D77\u5916\u5411\u3051\u8239\u8236\u7BA1\u7406\u30CB\u30FC\u30BA\u304B\u3089\u751F\u307E\u308C\u305FALCM\u306F\u3001\u65E5\u672C\u3001\u97D3\u56FD\u3001\u30B7\u30F3\u30AC\u30DD\u30FC\u30EB\u3001\u53F0\u6E7E\u5411\u3051\u8239\u8236\u6240\u6709\u8005\u3084\u30C9\u30A4\u30C4\u3067\u50CD\u304F\u719F\u7DF4\u52B4\u50CD\u8005\u3092\u652F\u3048\u308B\u56FD\u969B\u4EBA\u6750\u6D3E\u9063\u4F01\u696D\u3068\u3057\u3066\u6210\u9577\u3057\u307E\u3057\u305F\u3002",
        "5\u3064\u306E\u5C02\u9580\u90E8\u9580\u3092\u6301\u3064\u9589\u9396\u578B\u30E2\u30C7\u30EB\u306B\u3088\u308A\u3001\u63A1\u7528\u3001\u30D6\u30EA\u30C3\u30B8\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u542B\u3080STCW\u5B89\u5168\u6559\u80B2\u3001\u8A9E\u5B66\u30FBAI\u6559\u80B2\u3001\u4E57\u8239\u652F\u63F4\u3001\u5951\u7D04\u7D42\u4E86\u5F8C\u306E\u518D\u7D71\u5408\u652F\u63F4\u307E\u3067\u3092\u4E00\u8CAB\u3057\u3066\u62C5\u3063\u3066\u3044\u307E\u3059\u3002"
      ],
      stats: [
        { label: "\u8A2D\u7ACB\u65E5", value: "2022/07/21" },
        { label: "\u7A0E\u7C4D\u756A\u53F7", value: "0317391467" },
        { label: "\u54C1\u8CEA\u4F53\u5236", value: "ISO 9001:2015" },
        { label: "\u6D77\u4E8B\u6761\u7D04", value: "MLC 2006 (SRPS)" }
      ],
      licensesTitle: "\u8A8D\u8A3C\u30FB\u6CD5\u52D9\u8CC7\u683C",
      licenseCards: [
        { title: "SRPS\u8A8D\u8A3C\uFF08MLC 2006\uFF09", description: "ILO\u306E\u6D77\u54E1\u63A1\u7528\u30FB\u914D\u7F6E\u30B5\u30FC\u30D3\u30B9\u57FA\u6E96A1.4\u306B\u9069\u5408\u3057\u3066\u3044\u307E\u3059\u3002" },
        { title: "\u54C1\u8CEA\u7BA1\u7406\u4F53\u5236 ISO 9001:2015", description: "\u72EC\u7ACB\u3057\u305F\u56FD\u969B\u8A8D\u8A3C\u6A5F\u95A2\u306B\u3088\u308A\u5B9A\u671F\u8A55\u4FA1\u30FB\u8A8D\u8A3C\u3092\u53D7\u3051\u3066\u3044\u307E\u3059\u3002" },
        { title: "\u6D77\u5916\u52B4\u50CD\u8005\u6D3E\u9063\u4E8B\u696D\u8A8D\u53EF", description: "\u6CD5\u4EE469/2020/QH14\u306B\u57FA\u3065\u304F\u52B4\u50CD\u4F9B\u7D66\u5951\u7D04\u3092\u6CD5\u7684\u306B\u5B9F\u65BD\u3067\u304D\u307E\u3059\u3002" }
      ]
    },
    facilityTitle: "\u65BD\u8A2D\u914D\u7F6E\u56F3",
    facilityDescription: "\u4E8B\u52D9\u5BA4\u3001\u7814\u4FEE\u65BD\u8A2D\u3001\u5C4B\u5916\u5B9F\u7FD2\u30B9\u30DA\u30FC\u30B9\u306E\u914D\u7F6E\u3067\u3059\u3002",
    facilityAlt: "Au Lac Crew Manning\u306E\u4E8B\u52D9\u6240\u30FB\u7814\u4FEE\u65BD\u8A2D\u914D\u7F6E\u56F3",
    roomSignTitles: ["\u696D\u52D9\u30FB\u30B5\u30FC\u30D3\u30B9\u5BA4\u306E\u6848\u5185\u677F\uFF0801\uFF5E06\u53F7\u5BA4\uFF09", "\u6559\u5BA4\u306E\u6848\u5185\u677F\uFF0807\uFF5E12\u53F7\u5BA4\uFF09"],
    roomSignDescriptions: ["\u904B\u55B6\u3001\u4F1A\u8B70\u3001\u5FDC\u6025\u51E6\u7F6E\u3001\u6D77\u6D0B\u30B5\u30FC\u30D3\u30B9\u5404\u5BA4\u306E\u6848\u5185\u677F\u3067\u3059\u3002", "\u7814\u4FEE\u30FB\u6559\u80B2\u30B9\u30DA\u30FC\u30B9\u306E\u6848\u5185\u677F\u3067\u3059\u3002"],
    representativesDescription: "\u4E3B\u8981\u306A\u6D77\u5916\u5E02\u5834\u3067\u30D1\u30FC\u30C8\u30CA\u30FC\u3068\u306E\u9023\u643A\u3068\u5019\u88DC\u8005\u652F\u63F4\u3092\u884C\u3044\u307E\u3059\u3002",
    countries: ["\u30C1\u30A7\u30B3\u5171\u548C\u56FD", "\u30CF\u30F3\u30AC\u30EA\u30FC", "\u82F1\u56FD", "\u7C73\u56FD"],
    orgChartTitle: "\u4F1A\u793E\u7D44\u7E54\u56F3",
    governanceTitle: "\u4F01\u696D\u7D71\u6CBB\u30E2\u30C7\u30EB",
    orgChartDescription: "\u660E\u78BA\u306A\u8CAC\u4EFB\u5206\u62C5\u3001\u72EC\u7ACB\u3057\u305F\u76E3\u7763\u4F53\u5236\u3001ISO\u30FBMLC\u57FA\u6E96\u306B\u9069\u5408\u3057\u305F\u54C1\u8CEA\u904B\u55B6\u3002"
  },
  ko: {
    heroEyebrow: "\uAE30\uC5C5 \uC18C\uAC1C \uBC0F Au Lac \uC0DD\uD0DC\uACC4",
    heroTitle: "Au Lac Crew Manning \uC8FC\uC2DD\uD68C\uC0AC \uC18C\uAC1C",
    heroDescription: "Au Lac \uD574\uC6B4 \uC0DD\uD0DC\uACC4\uC758 \uC77C\uC6D0\uC73C\uB85C MLC 2006 \uAE30\uC900\uC5D0 \uB9DE\uB294 \uC120\uC6D0 \uACF5\uAE09, \uC6B0\uC218\uD55C \uD574\uC678 \uCDE8\uC5C5 \uC9C0\uC6D0 \uBC0F \uAD6D\uC81C \uAE30\uC900\uC758 \uC804\uBB38 \uAD50\uC721\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4.",
    sections: ["\uBE44\uC804\uACFC \uC57D\uC18D", "\uC11C\uBE44\uC2A4 \uC18C\uAC1C", "\uC2DC\uC124 \uBC0F \uC124\uBE44", "\uC778\uB825 \uAE30\uBC18", "\uD574\uC678 \uB300\uD45C"],
    vision: {
      eyebrow: "\uAE30\uC5C5 \uAC70\uBC84\uB10C\uC2A4\uC640 \uD22C\uBA85\uC131",
      title: "Au Lac Crew Manning \uC8FC\uC2DD\uD68C\uC0AC \uC18C\uAC1C",
      summary: "Au Lac \uD574\uC6B4 \uC0DD\uD0DC\uACC4\uC758 \uC804\uBB38 \uD68C\uC6D0\uC73C\uB85C \uACE0\uD488\uC9C8 \uC120\uC6D0 \uCC44\uC6A9\uACFC \uD574\uC678 \uC778\uB825 \uC1A1\uCD9C\uC744 \uB2F4\uB2F9\uD569\uB2C8\uB2E4.",
      profileParagraphs: [
        "Au Lac Crew Manning \uC8FC\uC2DD\uD68C\uC0AC(ALCM)\uB294 2022\uB144 7\uC6D4 21\uC77C \uD638\uCE58\uBBFC\uC2DC \uD22C\uC790\uACC4\uD68D\uBD80\uB85C\uBD80\uD130 \uC0AC\uC5C5\uC790 \uB4F1\uB85D \uC99D\uBA85\uC11C \uC81C0317391467\uD638\uB97C \uBC1C\uAE09\uBC1B\uC544 \uC6B4\uC601\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
        "Au Lac \uADF8\uB8F9\uC758 \uD574\uC0C1 \uC120\uBC15 \uAD00\uB9AC \uC218\uC694\uC5D0\uC11C \uCD9C\uBC1C\uD55C ALCM\uC740 \uC77C\uBCF8, \uD55C\uAD6D, \uC2F1\uAC00\uD3EC\uB974, \uB300\uB9CC \uBC0F \uB3C5\uC77C \uD604\uC9C0 \uC219\uB828 \uC778\uB825\uC5D0 \uB300\uD55C \uAD6D\uC81C \uC778\uB825 \uACF5\uAE09 \uAE30\uC5C5\uC73C\uB85C \uC131\uC7A5\uD588\uC2B5\uB2C8\uB2E4.",
        "5\uAC1C \uC804\uBB38 \uBCF8\uBD80\uC758 \uD3D0\uC1C4\uD615 \uC6B4\uC601 \uBAA8\uB378\uB85C \uCC44\uC6A9, \uBE0C\uB9AC\uC9C0 \uC2DC\uBBAC\uB808\uC774\uC158 \uAE30\uBC18 STCW \uC548\uC804 \uAD50\uC721, \uC5B8\uC5B4 \uAD50\uC721 \uBC0F AI \uAD50\uC721, \uC2B9\uC120 \uC9C0\uC6D0, \uACC4\uC57D \uC885\uB8CC \uD6C4 \uC7AC\uC801\uC751 \uC9C0\uC6D0\uAE4C\uC9C0 \uC77C\uAD00\uB418\uAC8C \uC6B4\uC601\uD569\uB2C8\uB2E4."
      ],
      stats: [
        { label: "\uC124\uB9BD\uC77C", value: "21/07/2022" },
        { label: "\uC138\uAE08 \uCF54\uB4DC", value: "0317391467" },
        { label: "\uD488\uC9C8 \uC2DC\uC2A4\uD15C", value: "ISO 9001:2015" },
        { label: "\uD574\uC0AC \uD611\uC57D", value: "MLC 2006 (SRPS)" }
      ],
      licensesTitle: "\uC778\uC99D \uBC0F \uBC95\uC801 \uC790\uACA9",
      licenseCards: [
        { title: "SRPS \uC778\uC99D (MLC 2006)", description: "ILO \uC120\uC6D0 \uCC44\uC6A9\xB7\uBC30\uCE58 \uC11C\uBE44\uC2A4 \uAE30\uC900 A1.4\uC5D0 \uBD80\uD569\uD569\uB2C8\uB2E4." },
        { title: "\uD488\uC9C8 \uACBD\uC601 \uC2DC\uC2A4\uD15C ISO 9001:2015", description: "\uB3C5\uB9BD\uC801\uC778 \uAD6D\uC81C \uC778\uC99D \uAE30\uAD00\uC5D0\uC11C \uC815\uAE30 \uD3C9\uAC00 \uBC0F \uC778\uC99D\uC744 \uBC1B\uC2B5\uB2C8\uB2E4." },
        { title: "\uD574\uC678 \uC778\uB825 \uC1A1\uCD9C \uC0AC\uC5C5 \uD5C8\uAC00", description: "\uBC95 69/2020/QH14\uC5D0 \uADFC\uAC70\uD55C \uC778\uB825 \uACF5\uAE09 \uACC4\uC57D\uC744 \uBC95\uC801\uC73C\uB85C \uC218\uD589\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }
      ]
    },
    facilityTitle: "\uC2DC\uC124 \uBC30\uCE58\uB3C4",
    facilityDescription: "\uC5C5\uBB34 \uACF5\uAC04, \uAD50\uC721 \uC2DC\uC124 \uBC0F \uC57C\uC678 \uC2E4\uC2B5 \uACF5\uAC04 \uBC30\uCE58\uC785\uB2C8\uB2E4.",
    facilityAlt: "\uC544\uC6B0\uB77D \uD06C\uB8E8 \uB9E4\uB2DD \uC0AC\uBB34\uC2E4 \uBC0F \uAD50\uC721 \uC2DC\uC124 \uBC30\uCE58\uB3C4",
    roomSignTitles: ["\uC5C5\uBB34\xB7\uC11C\uBE44\uC2A4\uC2E4 \uC548\uB0B4\uD310 (01~06\uD638)", "\uAC15\uC758\uC2E4 \uC548\uB0B4\uD310 (07~12\uD638)"],
    roomSignDescriptions: ["\uC6B4\uC601, \uD68C\uC758, \uC751\uAE09\uCC98\uCE58 \uBC0F \uD574\uC591 \uC11C\uBE44\uC2A4 \uACF5\uAC04 \uC548\uB0B4\uD310\uC785\uB2C8\uB2E4.", "\uAD50\uC721 \uBC0F \uD6C8\uB828 \uAC15\uC758\uC2E4 \uC548\uB0B4\uD310\uC785\uB2C8\uB2E4."],
    representativesDescription: "\uC8FC\uC694 \uD574\uC678 \uC2DC\uC7A5\uC5D0\uC11C \uD30C\uD2B8\uB108\uC640 \uD611\uB825\uD558\uACE0 \uC9C0\uC6D0\uC790\uC640 \uD568\uAED8\uD569\uB2C8\uB2E4.",
    countries: ["\uCCB4\uCF54", "\uD5DD\uAC00\uB9AC", "\uC601\uAD6D", "\uBBF8\uAD6D"],
    orgChartTitle: "\uD68C\uC0AC \uC870\uC9C1\uB3C4",
    governanceTitle: "\uAE30\uC5C5 \uAC70\uBC84\uB10C\uC2A4 \uBAA8\uB378",
    orgChartDescription: "\uBA85\uD655\uD55C \uAD8C\uD55C \uBD84\uB9AC, \uB3C5\uB9BD\uC801\uC778 \uAC10\uB3C5 \uCCB4\uACC4, ISO\xB7MLC \uAE30\uC900\uC5D0 \uB9DE\uB294 \uD488\uC9C8 \uC6B4\uC601."
  },
  zh: {
    heroEyebrow: "\u4F01\u4E1A\u7B80\u4ECB\u4E0E\u6B27\u4E50\u751F\u6001\u4F53\u7CFB",
    heroTitle: "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u80A1\u4EFD\u516C\u53F8\u4ECB\u7ECD",
    heroDescription: "\u4F5C\u4E3A\u6B27\u4E50\u6D77\u8FD0\u751F\u6001\u4F53\u7CFB\u7684\u4E00\u5458\uFF0C\u6211\u4EEC\u63D0\u4F9B\u7B26\u5408MLC 2006\u6807\u51C6\u7684\u8239\u5458\u670D\u52A1\u3001\u4F18\u8D28\u6D77\u5916\u5C31\u4E1A\u652F\u6301\u53CA\u7B26\u5408\u56FD\u9645\u6807\u51C6\u7684\u4E13\u4E1A\u57F9\u8BAD\u3002",
    sections: ["\u613F\u666F\u4E0E\u627F\u8BFA", "\u670D\u52A1\u4ECB\u7ECD", "\u8BBE\u65BD\u4E0E\u573A\u5730", "\u4EBA\u624D\u4E0E\u8D44\u6E90", "\u6D77\u5916\u4EE3\u8868"],
    vision: {
      eyebrow: "\u4F01\u4E1A\u6CBB\u7406\u4E0E\u900F\u660E\u5EA6",
      title: "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u80A1\u4EFD\u516C\u53F8\u4ECB\u7ECD",
      summary: "\u4F5C\u4E3A\u6B27\u4E50\u6D77\u8FD0\u751F\u6001\u4F53\u7CFB\u7684\u91CD\u8981\u6210\u5458\uFF0C\u6211\u4EEC\u4E13\u6CE8\u4E8E\u9AD8\u8D28\u91CF\u7684\u8239\u5458\u62DB\u8058\u4E0E\u6D77\u5916\u52B3\u52A1\u8F93\u51FA\u3002",
      profileParagraphs: [
        "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u80A1\u4EFD\u516C\u53F8\uFF08ALCM\uFF09\u6839\u636E\u80E1\u5FD7\u660E\u5E02\u89C4\u5212\u6295\u8D44\u5C40\u4E8E2022\u5E747\u670821\u65E5\u6838\u53D1\u7684\u8425\u4E1A\u767B\u8BB0\u8BC1\u53F70317391467\u5F00\u5C55\u4E1A\u52A1\u3002",
        "ALCM\u8D77\u6E90\u4E8E\u6EE1\u8DB3\u6B27\u4E50\u96C6\u56E2\u6D77\u4E0A\u8239\u961F\u7BA1\u7406\u9700\u6C42\uFF0C\u73B0\u5DF2\u53D1\u5C55\u4E3A\u9762\u5411\u65E5\u672C\u3001\u97E9\u56FD\u3001\u65B0\u52A0\u5761\u3001\u53F0\u6E7E\u53CA\u5FB7\u56FD\u7684\u56FD\u9645\u4EBA\u529B\u4F9B\u5E94\u5546\u3002",
        "\u901A\u8FC7\u4E94\u5927\u4E13\u4E1A\u90E8\u95E8\u95ED\u73AF\u8FD0\u8425\uFF0C\u4ECE\u62DB\u8058\u3001\u5305\u542B\u6865\u697C\u6A21\u62DF\u5668\u7684STCW\u5B89\u5168\u57F9\u8BAD\u3001\u8BED\u8A00\u53CAAI\u57F9\u8BAD\uFF0C\u5230\u4E0A\u8239\u652F\u6301\u53CA\u5408\u540C\u7ED3\u675F\u540E\u7684\u518D\u878D\u5165\u652F\u6301\u5747\u5B9E\u73B0\u5168\u6D41\u7A0B\u7BA1\u7406\u3002"
      ],
      stats: [
        { label: "\u6210\u7ACB\u65E5\u671F", value: "21/07/2022" },
        { label: "\u7A0E\u53F7", value: "0317391467" },
        { label: "\u8D28\u91CF\u4F53\u7CFB", value: "ISO 9001:2015" },
        { label: "\u6D77\u4E8B\u516C\u7EA6", value: "MLC 2006 (SRPS)" }
      ],
      licensesTitle: "\u8BA4\u8BC1\u4E0E\u5408\u6CD5\u8D44\u8D28",
      licenseCards: [
        { title: "SRPS\u8BA4\u8BC1\uFF08MLC 2006\uFF09", description: "\u7B26\u5408\u56FD\u9645\u52B3\u5DE5\u7EC4\u7EC7\u6D77\u5458\u62DB\u8058\u4E0E\u914D\u7F6E\u670D\u52A1\u6807\u51C6A1.4\u3002" },
        { title: "\u8D28\u91CF\u7BA1\u7406\u4F53\u7CFB ISO 9001:2015", description: "\u7531\u72EC\u7ACB\u56FD\u9645\u8BA4\u8BC1\u673A\u6784\u5B9A\u671F\u5BA1\u67E5\u548C\u786E\u8BA4\u3002" },
        { title: "\u6D77\u5916\u52B3\u52A1\u8F93\u51FA\u7ECF\u8425\u8BB8\u53EF\u8BC1", description: "\u4F9D\u6CD5\u5177\u5907\u6267\u884C\u6CD5\u4EE469/2020/QH14\u76F8\u5173\u52B3\u52A8\u4F9B\u7ED9\u5408\u540C\u8D44\u683C\u3002" }
      ]
    },
    facilityTitle: "\u573A\u5730\u529F\u80FD\u5E03\u5C40\u56FE",
    facilityDescription: "\u5C55\u793A\u529E\u516C\u533A\u57DF\u3001\u57F9\u8BAD\u8BBE\u65BD\u53CA\u6237\u5916\u5B9E\u8BAD\u7A7A\u95F4\u7684\u5E03\u5C40\u3002",
    facilityAlt: "\u6B27\u4E50\u8239\u5458\u7BA1\u7406\u529E\u516C\u5BA4\u53CA\u57F9\u8BAD\u573A\u5730\u5E73\u9762\u56FE",
    roomSignTitles: ["\u529E\u516C\u53CA\u670D\u52A1\u533A\u57DF\u6807\u8BC6\uFF0801\u201306\u5BA4\uFF09", "\u6559\u5BA4\u6807\u8BC6\uFF0807\u201312\u5BA4\uFF09"],
    roomSignDescriptions: ["\u8FD0\u8425\u3001\u4F1A\u8BAE\u3001\u6025\u6551\u53CA\u6D77\u6D0B\u670D\u52A1\u533A\u57DF\u7684\u623F\u95F4\u6807\u8BC6\u3002", "\u57F9\u8BAD\u4E0E\u6559\u5B66\u7A7A\u95F4\u7684\u623F\u95F4\u6807\u8BC6\u3002"],
    representativesDescription: "\u5728\u91CD\u70B9\u56FD\u9645\u5E02\u573A\u4E0E\u5408\u4F5C\u4F19\u4F34\u4FDD\u6301\u8054\u7CFB\u5E76\u4E3A\u5019\u9009\u4EBA\u63D0\u4F9B\u652F\u6301\u3002",
    countries: ["\u6377\u514B\u5171\u548C\u56FD", "\u5308\u7259\u5229", "\u82F1\u56FD", "\u7F8E\u56FD"],
    orgChartTitle: "\u516C\u53F8\u7EC4\u7EC7\u67B6\u6784\u56FE",
    governanceTitle: "\u4F01\u4E1A\u6CBB\u7406\u6A21\u578B",
    orgChartDescription: "\u660E\u786E\u7684\u804C\u8D23\u5212\u5206\u3001\u72EC\u7ACB\u76D1\u7763\u4E0E\u7B26\u5408ISO\u53CAMLC\u6807\u51C6\u7684\u8D28\u91CF\u7BA1\u7406\u4F53\u7CFB\u3002"
  }
};
function toTranslationFields(title, copy) {
  const visionEntries = {
    "vision.eyebrow": copy.vision.eyebrow,
    "vision.title": copy.vision.title,
    "vision.summary": copy.vision.summary,
    "vision.licensesTitle": copy.vision.licensesTitle,
    ...Object.fromEntries(copy.vision.profileParagraphs.map((value, index) => [`vision.profileParagraphs.${index}`, value])),
    ...Object.fromEntries(copy.vision.stats.flatMap((stat, statIndex) => [
      [`vision.stats.${statIndex}.label`, stat.label],
      [`vision.stats.${statIndex}.value`, stat.value]
    ])),
    ...Object.fromEntries(copy.vision.licenseCards.flatMap((card, cardIndex) => [
      [`vision.licenseCards.${cardIndex}.title`, card.title],
      [`vision.licenseCards.${cardIndex}.description`, card.description]
    ]))
  };
  return {
    title,
    heroEyebrow: copy.heroEyebrow,
    heroTitle: copy.heroTitle,
    heroDescription: copy.heroDescription,
    ...visionEntries,
    facilityTitle: copy.facilityTitle,
    facilityDescription: copy.facilityDescription,
    facilityAlt: copy.facilityAlt,
    representativesDescription: copy.representativesDescription,
    orgChartTitle: copy.orgChartTitle,
    governanceTitle: copy.governanceTitle,
    orgChartDescription: copy.orgChartDescription,
    ...Object.fromEntries(copy.sections.map((value, index) => [`sections.${index}`, value])),
    ...Object.fromEntries(copy.roomSignTitles.map((value, index) => [`roomSignTitles.${index}`, value])),
    ...Object.fromEntries(copy.roomSignDescriptions.map((value, index) => [`roomSignDescriptions.${index}`, value])),
    ...Object.fromEntries(copy.countries.map((value, index) => [`countries.${index}`, value]))
  };
}
var DEFAULT_ABOUT_PAGE_CONTENT = [{
  id: "about-alcm",
  title: "Gi\u1EDBi thi\u1EC7u v\u1EC1 ALCM",
  ...ABOUT_PAGE_COPY.vi,
  facilityPlanImage: "/company-floorplan.jpg",
  roomSignImageOne: "/src/assets/images/ba\u0309ng treo cu\u031B\u0309a pho\u0300ng -1.jpg",
  roomSignImageTwo: "/src/assets/images/ba\u0309ng treo cu\u031B\u0309a pho\u0300ng -2.jpg",
  orgChartImage: "/company-organization-chart.jpg",
  galleryImages: [
    { imageUrl: "/src/assets/images/hero_maritime_crew_1791511371631.jpg" },
    { imageUrl: "/src/assets/images/training_simulator_bridge_1791512952544.jpg" },
    { imageUrl: "/src/assets/images/japan_precision_engineers_1791512966858.jpg" },
    { imageUrl: "/src/assets/images/germany_healthcare_nursing_1791512988266.jpg" },
    { imageUrl: "/src/assets/images/tanker_cargo_operation_1791513000047.jpg" },
    { imageUrl: "/src/assets/images/vessel_aulac_tanker_1791511383610.jpg" },
    { imageUrl: "/src/assets/images/crew_training_safety_1791511397644.jpg" },
    { imageUrl: "/src/assets/images/overseas_labour_technical_1791511413734.jpg" }
  ],
  _translations: {
    en: toTranslationFields("About ALCM", ABOUT_PAGE_COPY.en),
    ja: toTranslationFields("ALCM\u306B\u3064\u3044\u3066", ABOUT_PAGE_COPY.ja),
    ko: toTranslationFields("ALCM \uC18C\uAC1C", ABOUT_PAGE_COPY.ko),
    zh: toTranslationFields("\u5173\u4E8EALCM", ABOUT_PAGE_COPY.zh)
  }
}];

// src/data/siteContent.ts
var SITE_CONTENT_SECTIONS = [
  { key: "divisions", label: "Kh\u1ED1i & d\u1ECBch v\u1EE5" },
  { key: "jobPositions", label: "V\u1ECB tr\xED tuy\u1EC3n d\u1EE5ng" },
  { key: "fleetVessels", label: "\u0110\u1ED9i t\xE0u" },
  { key: "newsArticles", label: "Tin t\u1EE9c" },
  { key: "upcomingEvents", label: "S\u1EF1 ki\u1EC7n" },
  { key: "crewTestimonials", label: "Chia s\u1EBB thuy\u1EC1n vi\xEAn" },
  { key: "aboutPage", label: "Gi\u1EDBi thi\u1EC7u v\u1EC1 ALCM" },
  { key: "heroSlides", label: "Slide trang ch\u1EE7" },
  { key: "homepageTicker", label: "Th\xF4ng b\xE1o trang ch\u1EE7" },
  { key: "campaignProjects", label: "Chi\u1EBFn d\u1ECBch tuy\u1EC3n d\u1EE5ng" },
  { key: "referralRewardTiers", label: "Ch\xEDnh s\xE1ch m\u1EE9c th\u01B0\u1EDFng" },
  { key: "brandAssets", label: "Logo th\u01B0\u01A1ng hi\u1EC7u" },
  { key: "socialLinks", label: "M\u1EA1ng x\xE3 h\u1ED9i" },
  { key: "translations", label: "N\u1ED9i dung \u0111a ng\xF4n ng\u1EEF" }
];
var LOCALIZABLE_LIST_KEYS = [
  "divisions",
  "jobPositions",
  "fleetVessels",
  "newsArticles",
  "upcomingEvents",
  "crewTestimonials",
  "aboutPage",
  "heroSlides",
  "homepageTicker",
  "campaignProjects",
  "referralRewardTiers"
];
var sourceSiteContent = {};
var activeSiteLanguage = "vi";
var BRAND_ASSETS = {
  siteLogoUrl: "/alcrewmanning-logo.png",
  siteLogoDarkUrl: "/alcrewmanning-logo.png",
  emblemUrl: "/aulac_emblem.png",
  emblemDarkUrl: "/aulac_emblem_dark.png",
  adminLoginLogoUrl: "/alcrewmanning-logo.png",
  faviconUrl: "/favicon.png"
};
var SOCIAL_LINKS = {
  facebookUrl: "https://facebook.com",
  zaloUrl: "https://zalo.me/0903396466",
  youtubeUrl: "",
  tiktokUrl: "",
  instagramUrl: "",
  linkedinUrl: ""
};
var ABOUT_PAGE_CONTENT = DEFAULT_ABOUT_PAGE_CONTENT;
var HERO_SLIDES = [
  { src: "/src/assets/images/hero_maritime_crew_1791511371631.jpg", tag: "Bu\u1ED3ng l\xE1i t\xE0u vi\u1EC5n d\u01B0\u01A1ng", title: "\u0110\u1ED9i ng\u0169 Thuy\u1EC1n vi\xEAn ALCM", desc: "H\u01A1n 1,200 s\u0129 quan v\xE0 thuy\u1EC1n vi\xEAn \u0111ang v\u1EADn h\xE0nh an to\xE0n tr\xEAn \u0111\u1ED9i t\xE0u vi\u1EC5n d\u01B0\u01A1ng v\xE0 c\xE1c \u0111\u1ED1i t\xE1c qu\u1ED1c t\u1EBF." },
  { src: "/src/assets/images/training_simulator_bridge_1791512952544.jpg", tag: "M\xF4 ph\u1ECFng 360\xB0 STCW", title: "Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c", desc: "H\u1EC7 th\u1ED1ng m\xF4 ph\u1ECFng radar, h\u1EA3i \u0111\u1ED3 \u0111i\u1EC7n t\u1EED ECDIS v\xE0 x\u1EED l\xFD t\xECnh hu\u1ED1ng h\xE0ng h\u1EA3i th\u1EF1c t\u1EBF." },
  { src: "/src/assets/images/tanker_cargo_operation_1791513000047.jpg", tag: "C\u1EA3ng n\u01B0\u1EDBc s\xE2u qu\u1ED1c t\u1EBF", title: "V\u1EADn h\xE0nh l\xE0m h\xE0ng an to\xE0n", desc: "Tu\xE2n th\u1EE7 nghi\xEAm ng\u1EB7t quy tr\xECnh ki\u1EC3m tra vetting, ti\xEAu chu\u1EA9n ISGOTT v\xE0 b\u1EA3o h\u1ED9 lao \u0111\u1ED9ng MLC 2006." }
];
var HOMEPAGE_TICKER = [
  { text: "Thuy\u1EC1n vi\xEAn Nguy\u1EC5n V. H. (M\xE3 ALCM-SEC-7829) \u0111\xE3 \u0111\u01B0\u1EE3c l\xEAn l\u1ECBch ph\u1ECFng v\u1EA5n ch\u1EE9c danh Thuy\u1EC1n tr\u01B0\u1EDFng", time: "V\u1EEBa xong" },
  { text: "30 K\u1EF9 s\u01B0 c\u01A1 kh\xED ch\xEDnh x\xE1c ho\xE0n t\u1EA5t gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng xu\u1EA5t c\u1EA3nh sang Aichi, Nh\u1EADt B\u1EA3n", time: "20 ph\xFAt tr\u01B0\u1EDBc" },
  { text: "Kho\xE1 hu\u1EA5n luy\u1EC7n An to\xE0n c\u01A1 b\u1EA3n STCW th\xE1ng 11/2026 \u0111\xE3 ti\u1EBFp nh\u1EADn 25 h\u1ECDc vi\xEAn \u0111\u0103ng k\xFD", time: "45 ph\xFAt tr\u01B0\u1EDBc" },
  { text: "\u0110\u1ED9i t\xE0u Aulac Vanguard \u0111\xE3 ti\u1EBFp nh\u1EADn tr\u1ECDn b\u1ED9 22 thuy\u1EC1n vi\xEAn \u0111\u1EA1t chu\u1EA9n MLC 2006 t\u1EA1i Singapore", time: "1 gi\u1EDD tr\u01B0\u1EDBc" }
];
var CAMPAIGN_PROJECTS = [
  { title: "D\u1EF1 \xE1n Cung \u1EE9ng Thuy\u1EC1n vi\xEAn T\xE0u d\u1EA7u VLCC & H\xF3a ch\u1EA5t Qu\u1ED1c t\u1EBF", tag: "C\u1EA7n tuy\u1EC3n g\u1EA5p 25 ch\u1EE9c danh", salary: "45.000.000 - 120.000.000 VN\u0110/th\xE1ng", owner: "Ch\u1EE7 t\xE0u Nh\u1EADt B\u1EA3n & Singapore", deadline: "Th\xE1ng n\xE0y", desc: "Tuy\u1EC3n b\u1ED5 sung kh\u1EA9n c\u1EA5p Thuy\u1EC1n tr\u01B0\u1EDFng, M\xE1y tr\u01B0\u1EDFng, \u0110\u1EA1i ph\xF3 v\xE0 Th\u1EE7y th\u1EE7 AB c\xF3 kinh nghi\u1EC7m t\xE0u d\u1EA7u s\u1EA3n ph\u1EA9m, t\xE0u h\xF3a ch\u1EA5t \u0111\u1EA1t chu\u1EA9n SIRE/CDI.", route: "/ngoai-khoi-thuyen-vien" },
  { title: "Chi\u1EBFn d\u1ECBch K\u1EF9 s\u01B0 C\u01A1 kh\xED & T\u1EF1 \u0111\u1ED9ng ho\xE1 Kansai (Nh\u1EADt B\u1EA3n)", tag: "Ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp \u0111\u1EE3t 1", salary: "38.000.000 - 52.000.000 VN\u0110/th\xE1ng", owner: "T\u1EADp \u0111o\xE0n Ch\u1EBF t\u1EA1o M\xE1y Kansai", deadline: "\u0110ang m\u1EDF", desc: "Doanh nghi\u1EC7p \u0111\xE0i th\u1ECD 100% chi ph\xED xu\u1EA5t c\u1EA3nh, v\xE9 m\xE1y bay v\xE0 h\u1ED7 tr\u1EE3 k\xFD t\xFAc x\xE1. C\u01A1 h\u1ED9i b\u1EA3o l\xE3nh gia \u0111\xECnh sang sinh s\u1ED1ng l\xE2u d\xE0i sau 1 n\u0103m.", route: "/xuat-khau-nguon-luc" },
  { title: "D\u1EF1 \xE1n Du h\u1ECDc ngh\u1EC1 K\xE9p \u0110i\u1EC1u d\u01B0\u1EE1ng & C\u01A1 \u0111i\u1EC7n CHLB \u0110\u1EE9c", tag: "Mi\u1EC5n 100% h\u1ECDc ph\xED", salary: "Tr\u1EE3 c\u1EA5p 1.100 - 1.400 EUR/th\xE1ng", owner: "H\u1EC7 th\u1ED1ng Y t\u1EBF & Vi\u1EC7n d\u01B0\u1EE1ng l\xE3o \u0110\u1EE9c", deadline: "K\u1EF3 Thu 2026", desc: "V\u1EEBa h\u1ECDc l\xFD thuy\u1EBFt v\u1EEBa th\u1EF1c h\xE0nh c\xF3 l\u01B0\u01A1ng t\u1EEB n\u0103m th\u1EE9 nh\u1EA5t. B\u1EB1ng ngh\u1EC1 chu\u1EA9n Ch\xE2u \xC2u v\xE0 k\xFD h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng v\xF4 th\u1EDDi h\u1EA1n sau t\u1ED1t nghi\u1EC7p.", route: "/du-hoc-au-lac" }
];
var REFERRAL_REWARD_TIERS = [
  { rank: "S\u0129 quan qu\u1EA3n l\xFD (Management Level)", roles: "Thuy\u1EC1n tr\u01B0\u1EDFng (Master), M\xE1y tr\u01B0\u1EDFng (C/E)", reward: "12.000.000 - 15.000.000 VN\u0110", highlight: true, condition: "C\xF3 b\u1EB1ng H\u1EA1ng 1, kinh nghi\u1EC7m t\u1ED1i thi\u1EC3u 1 h\u1EE3p \u0111\u1ED3ng t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t, nh\u1EADn t\xE0u vi\u1EC5n d\u01B0\u01A1ng" },
  { rank: "S\u0129 quan c\u1EA5p hai (Second Officers / Seconds)", roles: "\u0110\u1EA1i ph\xF3 (C/O), M\xE1y hai (2/E)", reward: "8.000.000 - 10.000.000 VN\u0110", highlight: false, condition: "Kinh nghi\u1EC7m ch\u1EE9c danh t\u1EEB 12 th\xE1ng, vetting SIRE t\u1ED1t" },
  { rank: "S\u0129 quan v\u1EADn h\xE0nh & \u0110i\u1EC7n (Operational & ETO)", roles: "Ph\xF3 hai (2/O), Ph\xF3 ba (3/O), M\xE1y ba (3/E), M\xE1y t\u01B0 (4/E), S\u0129 quan \u0111i\u1EC7n ETO", reward: "5.000.000 - 7.000.000 VN\u0110", highlight: false, condition: "\u0110\u1EA7y \u0111\u1EE7 ch\u1EE9ng ch\u1EC9 STCW theo ch\u1EE9c danh, ti\u1EBFng Anh giao ti\u1EBFp h\xE0ng h\u1EA3i t\u1ED1t" },
  { rank: "Th\u1EE7y th\u1EE7, Th\u1EE3 m\xE1y & Kh\u1ED1i Ph\u1EE5c v\u1EE5 (Ratings)", roles: "Th\u1EE7y th\u1EE7 AB / OS, Th\u1EE3 m\xE1y Oiler / Wiper / Fitter, B\u1EBFp tr\u01B0\u1EDFng (Chief Cook)", reward: "3.000.000 - 4.500.000 VN\u0110", highlight: false, condition: "C\xF3 ch\u1EE9ng ch\u1EC9 nghi\u1EC7p v\u1EE5 h\xE0ng h\u1EA3i STCW, s\u1EE9c kh\u1ECFe lo\u1EA1i 1 theo B\u1ED9 GTVT" },
  { rank: "C\u01A1 h\u1ED9i ngh\u1EC1 nghi\u1EC7p & K\u1EF9 s\u01B0 XKL\u0110 (Overseas Labour)", roles: "K\u1EF9 s\u01B0 c\u01A1 kh\xED / \u0111i\u1EC7n \u0111i Nh\u1EADt B\u1EA3n, \u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn sang CHLB \u0110\u1EE9c, Th\u1EE3 h\xE0n E-7", reward: "5.000.000 - 8.000.000 VN\u0110", highlight: true, condition: "\u1EE8ng vi\xEAn tr\xFAng tuy\u1EC3n ph\u1ECFng v\u1EA5n v\xE0 ho\xE0n t\u1EA5t th\u1EE7 t\u1EE5c xu\u1EA5t c\u1EA3nh h\u1EE3p ph\xE1p" }
];
function getDefaultSiteContent() {
  replaceTranslations(TRANSLATIONS);
  return {
    divisions: DIVISIONS,
    jobPositions: JOB_POSITIONS,
    fleetVessels: FLEET_VESSELS,
    newsArticles: NEWS_ARTICLES,
    upcomingEvents: UPCOMING_EVENTS,
    crewTestimonials: CREW_TESTIMONIALS,
    aboutPage: ABOUT_PAGE_CONTENT,
    heroSlides: HERO_SLIDES,
    homepageTicker: HOMEPAGE_TICKER,
    campaignProjects: CAMPAIGN_PROJECTS,
    referralRewardTiers: REFERRAL_REWARD_TIERS,
    brandAssets: BRAND_ASSETS,
    socialLinks: SOCIAL_LINKS,
    translations: TRANSLATIONS
  };
}
function applyRecordTranslations(value) {
  if (Array.isArray(value)) return value.map(applyRecordTranslations);
  if (!value || typeof value !== "object") return value;
  const record = value;
  const translations = record._translations && typeof record._translations === "object" ? record._translations[activeSiteLanguage] || {} : {};
  const localize = (entry, fieldPath) => {
    if (typeof entry === "string") return translations[fieldPath]?.trim() ? translations[fieldPath] : entry;
    if (Array.isArray(entry)) return entry.map((child, index) => localize(child, fieldPath ? `${fieldPath}.${index}` : String(index)));
    if (!entry || typeof entry !== "object") return entry;
    return Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "_translations").map(([key, child]) => [key, localize(child, fieldPath ? `${fieldPath}.${key}` : key)]));
  };
  return localize(record, "");
}
function applySiteContentLanguage() {
  const localizedContent = { ...sourceSiteContent };
  for (const key of LOCALIZABLE_LIST_KEYS) {
    const values = key === "aboutPage" ? sourceSiteContent.aboutPage ?? DEFAULT_ABOUT_PAGE_CONTENT : sourceSiteContent[key];
    if (Array.isArray(values)) localizedContent[key] = values.map(applyRecordTranslations);
  }
  replacePublicContent(localizedContent);
  if (Array.isArray(localizedContent.heroSlides)) HERO_SLIDES = localizedContent.heroSlides;
  if (Array.isArray(localizedContent.homepageTicker)) HOMEPAGE_TICKER = localizedContent.homepageTicker;
  if (Array.isArray(localizedContent.campaignProjects)) CAMPAIGN_PROJECTS = localizedContent.campaignProjects;
  if (Array.isArray(localizedContent.referralRewardTiers)) REFERRAL_REWARD_TIERS = localizedContent.referralRewardTiers;
  if (Array.isArray(localizedContent.aboutPage)) ABOUT_PAGE_CONTENT = localizedContent.aboutPage;
  if (localizedContent.translations && typeof localizedContent.translations === "object" && !Array.isArray(localizedContent.translations)) {
    replaceTranslations(localizedContent.translations);
  }
  if (localizedContent.brandAssets && typeof localizedContent.brandAssets === "object" && !Array.isArray(localizedContent.brandAssets)) {
    BRAND_ASSETS = { ...BRAND_ASSETS, ...localizedContent.brandAssets };
    const faviconLink = document.querySelector("#site-favicon");
    if (faviconLink) {
      const faviconUrl = BRAND_ASSETS.faviconUrl || "/favicon.png";
      const pathname = new URL(faviconUrl, window.location.href).pathname.toLowerCase();
      faviconLink.href = faviconUrl;
      faviconLink.type = pathname.endsWith(".svg") ? "image/svg+xml" : pathname.endsWith(".webp") ? "image/webp" : pathname.endsWith(".avif") ? "image/avif" : pathname.endsWith(".jpg") || pathname.endsWith(".jpeg") ? "image/jpeg" : "image/png";
    }
  }
  if (localizedContent.socialLinks && typeof localizedContent.socialLinks === "object" && !Array.isArray(localizedContent.socialLinks)) {
    SOCIAL_LINKS = { ...SOCIAL_LINKS, ...localizedContent.socialLinks };
  }
}
function setSiteContentLanguage(language) {
  activeSiteLanguage = language;
  applySiteContentLanguage();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SITE_CONTENT_REFRESHED_EVENT));
}
if (typeof window !== "undefined") {
  window.addEventListener(SITE_CONTENT_LANGUAGE_EVENT, (event) => {
    const language = event.detail;
    if (language === "vi" || language === "en" || language === "zh") {
      setSiteContentLanguage(language);
    }
  });
}

// server.ts
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var defaultPort = Number(process.env.PORT || 4380);
var applicationStatusProgress = {
  "\u0110\xE3 ti\u1EBFp nh\u1EADn": 20,
  "\u0110ang th\u1EA9m \u0111\u1ECBnh h\u1ED3 s\u01A1": 40,
  "L\xEAn l\u1ECBch ph\u1ECFng v\u1EA5n": 60,
  "\u0110\xE0o t\u1EA1o & \u0110\u1ECBnh h\u01B0\u1EDBng": 80,
  "Ho\xE0n t\u1EA5t th\u1EE7 t\u1EE5c xu\u1EA5t c\u1EA3nh": 100
};
var uploadsDir = path.join(__dirname, "uploads");
var imageUploadsDir = path.join(uploadsDir, "images");
var databaseReady = false;
var adminCookieName = "alcm_admin_session";
var adminSessionDuration = 8 * 60 * 60 * 1e3;
var siteContentKeys = new Set(SITE_CONTENT_SECTIONS.map(({ key }) => key));
function addDefaultTranslationKeys(content) {
  const defaults = getDefaultSiteContent().translations;
  const saved = content.translations && typeof content.translations === "object" ? content.translations : {};
  content.translations = Object.fromEntries(["vi", "en", "ja", "ko", "zh"].map((language) => [
    language,
    {
      ...defaults[language],
      ...saved[language] || {},
      siteCopy: { ...defaults[language]?.siteCopy || {}, ...saved[language]?.siteCopy || {} }
    }
  ]));
  return content;
}
fs.mkdirSync(uploadsDir, { recursive: true });
var upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const uniqueName = `${Date.now()}-${safeName}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (allowed.includes(file.mimetype) || /\.(pdf|docx|doc)$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF, DOCX, DOC files are allowed."));
  }
});
var imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const allowedExtensions = /\.(jpe?g|png|webp|avif)$/i;
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
      cb(null, true);
      return;
    }
    cb(new Error("Ch\u1EC9 h\u1ED7 tr\u1EE3 \u1EA3nh JPG, PNG, WebP ho\u1EB7c AVIF."));
  }
});
app.use(express.json({ limit: "3mb" }));
app.use("/uploads/images", express.static(imageUploadsDir));
function hasValidAdminSession(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${adminCookieName}=`))?.slice(adminCookieName.length + 1);
  if (!cookie) return false;
  const [expiresAt, signature, extra] = cookie.split(".");
  if (!expiresAt || !signature || extra || Number(expiresAt) <= Date.now()) return false;
  const expected = createHmac("sha256", password).update(expiresAt).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "Ch\u01B0a c\u1EA5u h\xECnh ADMIN_PASSWORD tr\xEAn m\xE1y ch\u1EE7." });
    return;
  }
  if (!hasValidAdminSession(req)) {
    res.status(401).json({ error: "Vui l\xF2ng \u0111\u0103ng nh\u1EADp qu\u1EA3n tr\u1ECB." });
    return;
  }
  next();
}
app.get("/api/site-content", async (_req, res) => {
  try {
    const content = databaseReady ? await getSiteContent() : getDefaultSiteContent();
    res.json({ content: addDefaultTranslationKeys(content) });
  } catch (error) {
    console.error("Read site content error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 t\u1EA3i n\u1ED9i dung website." });
  }
});
app.post("/api/admin/login", (req, res) => {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    res.status(503).json({ error: "Ch\u01B0a c\u1EA5u h\xECnh ADMIN_PASSWORD tr\xEAn m\xE1y ch\u1EE7." });
    return;
  }
  const suppliedPassword = typeof req.body?.password === "string" ? req.body.password : "";
  const expected = Buffer.from(expectedPassword);
  const supplied = Buffer.from(suppliedPassword);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    res.status(401).json({ error: "M\u1EADt kh\u1EA9u qu\u1EA3n tr\u1ECB kh\xF4ng \u0111\xFAng." });
    return;
  }
  const expiresAt = String(Date.now() + adminSessionDuration);
  const signature = createHmac("sha256", expectedPassword).update(expiresAt).digest("hex");
  res.cookie(adminCookieName, `${expiresAt}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: adminSessionDuration,
    path: "/api/admin"
  });
  res.json({ success: true });
});
app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie(adminCookieName, { httpOnly: true, sameSite: "strict", path: "/api/admin" });
  res.json({ success: true });
});
app.get("/api/admin/site-content", requireAdmin, async (_req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng." });
    return;
  }
  try {
    res.json({ content: addDefaultTranslationKeys(await getSiteContent()) });
  } catch (error) {
    console.error("Read admin content error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u1EA5y n\u1ED9i dung qu\u1EA3n tr\u1ECB." });
  }
});
app.post("/api/admin/media/images", requireAdmin, (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng." });
    return;
  }
  imageUpload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      const statusCode = uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      res.status(statusCode).json({ error: uploadError.message || "Kh\xF4ng th\u1EC3 nh\u1EADn \u1EA3nh." });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Vui l\xF2ng ch\u1ECDn m\u1ED9t \u1EA3nh \u0111\u1EC3 t\u1EA3i l\xEAn." });
      return;
    }
    const profile = req.body?.profile === "hero" ? "hero" : req.body?.profile === "general" ? "general" : null;
    const requestedMode = req.body?.mode;
    if (!profile || !["compressed", "original"].includes(requestedMode)) {
      res.status(400).json({ error: "Thi\u1EBFu profile \u1EA3nh ho\u1EB7c ch\u1EBF \u0111\u1ED9 x\u1EED l\xFD h\u1EE3p l\u1EC7." });
      return;
    }
    let storedPath = "";
    try {
      const metadata = await sharp(file.buffer, { limitInputPixels: 4e7 }).metadata();
      const supportedFormats = ["jpeg", "png", "webp", "avif"];
      if (!metadata.format || !supportedFormats.includes(metadata.format) || !metadata.width || !metadata.height) {
        res.status(415).json({ error: "T\u1EC7p kh\xF4ng ph\u1EA3i \u1EA3nh JPG, PNG, WebP ho\u1EB7c AVIF h\u1EE3p l\u1EC7." });
        return;
      }
      const orientationSwapsDimensions = [5, 6, 7, 8].includes(metadata.orientation || 0);
      const originalWidth = orientationSwapsDimensions ? metadata.height : metadata.width;
      const originalHeight = orientationSwapsDimensions ? metadata.width : metadata.height;
      if (originalWidth * originalHeight > 4e7) {
        res.status(413).json({ error: "\u1EA2nh v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n 40 megapixel." });
        return;
      }
      const compressionMode = requestedMode;
      const fileId = randomUUID();
      let outputBuffer = file.buffer;
      let outputWidth = originalWidth;
      let outputHeight = originalHeight;
      let outputFormat = metadata.format;
      if (compressionMode === "compressed") {
        const maxDimensions = profile === "hero" ? { width: 1920, height: 1080 } : { width: 1600, height: 1600 };
        const compressed = await sharp(file.buffer, { limitInputPixels: 4e7 }).rotate().resize({ ...maxDimensions, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
        outputBuffer = compressed.data;
        outputWidth = compressed.info.width;
        outputHeight = compressed.info.height;
        outputFormat = "webp";
      }
      const extensions = { jpeg: "jpg", png: "png", webp: "webp", avif: "avif" };
      const mimeTypes = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
      const storageFilename = `${fileId}.${extensions[outputFormat]}`;
      const fileUrl = `/uploads/images/${storageFilename}`;
      await fs.promises.mkdir(imageUploadsDir, { recursive: true });
      storedPath = path.join(imageUploadsDir, storageFilename);
      await fs.promises.writeFile(storedPath, outputBuffer, { flag: "wx" });
      await saveSiteMediaAsset({
        id: fileId,
        originalFilename: path.basename(file.originalname).slice(0, 255),
        storageFilename,
        fileUrl,
        mimeType: mimeTypes[outputFormat],
        profile,
        compressionMode,
        originalWidth,
        originalHeight,
        originalSizeBytes: file.size,
        outputWidth,
        outputHeight,
        outputSizeBytes: outputBuffer.length
      });
      res.status(201).json({
        url: fileUrl,
        compressionMode,
        mimeType: mimeTypes[outputFormat],
        original: { width: originalWidth, height: originalHeight, sizeBytes: file.size },
        output: { width: outputWidth, height: outputHeight, sizeBytes: outputBuffer.length }
      });
    } catch (error) {
      if (storedPath) await fs.promises.unlink(storedPath).catch(() => void 0);
      console.error("Upload site image error:", error);
      res.status(400).json({ error: "Kh\xF4ng th\u1EC3 x\u1EED l\xFD \u1EA3nh. H\xE3y ki\u1EC3m tra \u0111\u1ECBnh d\u1EA1ng, k\xEDch th\u01B0\u1EDBc v\xE0 th\u1EED l\u1EA1i." });
    }
  });
});
app.post("/api/admin/translations/suggest", requireAdmin, async (req, res) => {
  const fields = req.body?.fields;
  const requestedTargets = req.body?.targetLanguages;
  const allowedTargets = ["en", "ja", "ko", "zh"];
  if (!fields || typeof fields !== "object" || Array.isArray(fields) || !Array.isArray(requestedTargets)) {
    res.status(400).json({ error: "D\u1EEF li\u1EC7u d\u1ECBch kh\xF4ng h\u1EE3p l\u1EC7." });
    return;
  }
  const entries = Object.entries(fields);
  if (entries.length === 0 || entries.length > 120 || entries.some(([key, value]) => key.length > 500 || typeof value !== "string")) {
    res.status(400).json({ error: "N\u1ED9i dung d\u1ECBch r\u1ED7ng ho\u1EB7c v\u01B0\u1EE3t gi\u1EDBi h\u1EA1n." });
    return;
  }
  const totalCharacters = entries.reduce((sum, [, value]) => sum + String(value).length, 0);
  if (totalCharacters > 24e3) {
    res.status(413).json({ error: "N\u1ED9i dung c\u1EA7n d\u1ECBch v\u01B0\u1EE3t qu\xE1 24.000 k\xFD t\u1EF1." });
    return;
  }
  const targetLanguages = [...new Set(requestedTargets.filter(
    (language) => typeof language === "string" && allowedTargets.includes(language)
  ))];
  if (targetLanguages.length === 0) {
    res.status(400).json({ error: "Ch\u1ECDn \xEDt nh\u1EA5t m\u1ED9t ng\xF4n ng\u1EEF c\u1EA7n d\u1ECBch." });
    return;
  }
  try {
    const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
    const model = process.env.OLLAMA_TRANSLATION_MODEL || "qwen3:8b";
    const prompt = [
      "Translate each Vietnamese website content value only into the requested target languages.",
      `Keep the exact input field paths as JSON keys. Return exactly this JSON shape: ${JSON.stringify(Object.fromEntries(targetLanguages.map((language) => [language, { "field.path": `${language} translation` }])))}. Include every requested field under every requested target language. Return valid JSON only.`,
      "Preserve meaning, professional maritime/recruitment tone, names, technical acronyms (STCW, MLC, IMO), URLs, dates, quantities, salary amounts, and currency units. Do not add commentary or markdown.",
      `Target languages: ${targetLanguages.join(", ")}.`,
      `Vietnamese source fields: ${JSON.stringify(Object.fromEntries(entries))}`
    ].join("\n");
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system: "You are a professional website localization translator. Return only valid JSON, without markdown fences.",
        prompt,
        stream: false,
        format: "json",
        think: false,
        options: { temperature: 0.1, num_ctx: 8192, num_predict: 4096 }
      })
    });
    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}.`);
    }
    const ollamaResult = await response.json();
    const parsed = JSON.parse(typeof ollamaResult.response === "string" ? ollamaResult.response : "{}");
    const output = parsed.translations && typeof parsed.translations === "object" && !Array.isArray(parsed.translations) ? parsed.translations : parsed;
    const normalizedOutput = Object.fromEntries(Object.entries(output).map(([key, value]) => [key.trim().toLowerCase(), value]));
    const languageAliases = {
      en: ["en", "english"],
      ja: ["ja", "japanese", "ja-jp"],
      ko: ["ko", "korean", "ko-kr"],
      zh: ["zh", "chinese", "simplified chinese", "zh-cn"]
    };
    const translations = {};
    for (const language of targetLanguages) {
      const languageResult = languageAliases[language].map((alias) => normalizedOutput[alias]).find((value) => Boolean(value && typeof value === "object" && !Array.isArray(value)));
      if (!languageResult || typeof languageResult !== "object" || Array.isArray(languageResult)) {
        translations[language] = {};
        continue;
      }
      translations[language] = {};
      for (const [fieldPath] of entries) {
        const translatedValue = languageResult[fieldPath];
        if (typeof translatedValue === "string" && translatedValue.trim()) {
          translations[language][fieldPath] = translatedValue.trim();
        }
      }
    }
    res.json({ translations, provider: "local" });
  } catch (error) {
    console.error("Content translation suggestion error:", error);
    res.status(502).json({
      error: "Kh\xF4ng k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c m\xF4 h\xECnh d\u1ECBch n\u1ED9i b\u1ED9. H\xE3y ki\u1EC3m tra Ollama \u0111ang ch\u1EA1y v\xE0 \u0111\xE3 c\xF3 m\xF4 h\xECnh qwen3:8b."
    });
  }
});
app.put("/api/admin/site-content/:key", requireAdmin, async (req, res) => {
  const { key } = req.params;
  const content = req.body?.content;
  if (!siteContentKeys.has(key)) {
    res.status(404).json({ error: "Nh\xF3m n\u1ED9i dung kh\xF4ng t\u1ED3n t\u1EA1i." });
    return;
  }
  if (key === "translations" || key === "brandAssets" || key === "socialLinks" ? !content || typeof content !== "object" || Array.isArray(content) : !Array.isArray(content) || content.length === 0) {
    res.status(400).json({ error: "C\u1EA5u tr\xFAc n\u1ED9i dung kh\xF4ng h\u1EE3p l\u1EC7." });
    return;
  }
  if (Buffer.byteLength(JSON.stringify(content)) > 2 * 1024 * 1024) {
    res.status(413).json({ error: "N\u1ED9i dung v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n 2 MB." });
    return;
  }
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng." });
    return;
  }
  try {
    await saveSiteContent(key, content);
    res.json({ success: true });
  } catch (error) {
    console.error("Save site content error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u01B0u n\u1ED9i dung website." });
  }
});
async function initializeDatabase() {
  if (!mysqlConfigured) {
    console.warn("MySQL not configured yet. Data will be stored in memory until MYSQL_* variables are set in .env.");
    return;
  }
  try {
    await ensureDatabaseReady();
    await seedSiteContentDefaults(getDefaultSiteContent());
    databaseReady = true;
    console.log("MySQL database initialized successfully.");
  } catch (error) {
    console.warn("MySQL connection failed. Falling back to in-memory data storage.", error);
  }
}
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var ALCM_SYSTEM_INSTRUCTION = `
B\u1EA1n l\xE0 "ALCM AI Consultant" - Chuy\xEAn vi\xEAn t\u01B0 v\u1EA5n AI th\xF4ng minh v\xE0 t\u1EADn t\xE2m c\u1EE7a C\xF4ng ty C\u1ED5 ph\u1EA7n \xC2u L\u1EA1c Crew Manning (ALCM).

TH\xD4NG TIN DOANH NGHI\u1EC6P:
- T\xEAn: C\xF4ng ty C\u1ED5 ph\u1EA7n \xC2u L\u1EA1c Crew Manning (ALCM), MST: 0317391467 (c\u1EA5p ng\xE0y 21/07/2022).
- Tr\u1EE5 s\u1EDF: 117 Nguy\u1EC5n C\u1EEDu V\xE2n, Ph\u01B0\u1EDDng 17, Qu\u1EADn B\xECnh Th\u1EA1nh, TP. H\u1ED3 Ch\xED Minh.
- Hotline/Zalo: 0903 396 466 | \u0110i\u1EC7n tho\u1EA1i b\xE0n: (028) 6656 7899 | Email: info@alcrewmanning.vn.
- Ph\xE1p l\xFD & Ti\xEAu chu\u1EA9n: \u0110\u1EA1t ch\u1EE9ng nh\u1EADn ISO 9001:2015, Ti\xEAu chu\u1EA9n A1.4 SRPS theo C\xF4ng \u01B0\u1EDBc Lao \u0111\u1ED9ng H\xE0ng h\u1EA3i MLC 2006, Gi\u1EA5y ph\xE9p \u0111\u01B0a NL\u0110 \u0111i l\xE0m vi\u1EC7c \u1EDF n\u01B0\u1EDBc ngo\xE0i theo B\u1ED9 L\u0110-TB&XH.
- Thu\u1ED9c h\u1EC7 sinh th\xE1i v\u1EADn t\u1EA3i bi\u1EC3n \xC2u L\u1EA1c (aulac.com.vn) v\u1EDBi \u0111\u1ED9i t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t: Aulac Vision, Aulac Vanguard, Aulac Diamond, Aulac Conifer, Aulac Aurora, Aulac Bella.

5 KH\u1ED0I CHUY\xCAN M\xD4N:
1. Kh\u1ED1i 01 (Ngo\xE0i kh\u01A1i & Thuy\u1EC1n vi\xEAn - crewing@alcrewmanning.vn): Tuy\u1EC3n d\u1EE5ng, th\u1EA9m \u0111\u1ECBnh STCW, b\u1ED1 tr\xED thuy\u1EC1n vi\xEAn theo chuy\u1EBFn ho\u1EB7c tr\u1ECDn thuy\u1EC1n b\u1ED9; qu\u1EA3n l\xFD k\u1EF9 thu\u1EADt an to\xE0n ISM/ISPS; d\u1ECBch v\u1EE5 ngo\xE0i kh\u01A1i gi\xE0n khoan; ph\xE1p ch\u1EBF MLC 2006.
2. Kh\u1ED1i 02 (\u0110\xE0o t\u1EA1o & Hu\u1EA5n luy\u1EC7n - daotao@alcrewmanning.vn): TT Hu\u1EA5n luy\u1EC7n STCW (m\xF4 ph\u1ECFng bu\u1ED3ng l\xE1i 360 \u0111\u1ED9, an to\xE0n c\u01A1 b\u1EA3n, ch\u1EEFa ch\xE1y n\xE2ng cao, c\u1EE9u sinh, s\u01A1 c\u1EE9u); TT Ngo\u1EA1i ng\u1EEF tin h\u1ECDc (Ti\u1EBFng Anh h\xE0ng h\u1EA3i SMCP, Ti\u1EBFng Nh\u1EADt N5-N3, Ti\u1EBFng \u0110\u1EE9c B1-B2); TT \u1EE8ng d\u1EE5ng AI; Ph\xF2ng Gi\xE1o d\u1EE5c \u0111\u1ECBnh h\u01B0\u1EDBng.
3. Kh\u1ED1i 03 (Lao \u0111\u1ED9ng n\u01B0\u1EDBc ngo\xE0i - laodong@alcrewmanning.vn): K\u1EF9 s\u01B0 c\u01A1 kh\xED/t\u1EF1 \u0111\u1ED9ng h\xF3a Nh\u1EADt B\u1EA3n (l\u01B0\u01A1ng 42-58 tr/th\xE1ng, b\u1EA3o l\xE3nh gia \u0111\xECnh); \u0110i\u1EC1u d\u01B0\u1EE1ng CHLB \u0110\u1EE9c (l\u01B0\u01A1ng 65-85 tr/th\xE1ng, \u0111\u1ECBnh c\u01B0 sau 3-5 n\u0103m); Th\u1EE3 h\xE0n c\xF4ng ngh\u1EC7 cao E-7 H\xE0n Qu\u1ED1c (48-62 tr/th\xE1ng); chuy\xEAn gia n\u01B0\u1EDBc ngo\xE0i t\u1EA1i VN.
4. Kh\u1ED1i 04 (T\u01B0 v\u1EA5n du h\u1ECDc - duhoc@alcrewmanning.vn): Du h\u1ECDc ngh\u1EC1 k\xE9p \u0110\u1EE9c (mi\u1EC5n 100% h\u1ECDc ph\xED, tr\u1EE3 c\u1EA5p th\u1EF1c t\u1EADp 28-35 tr/th\xE1ng), du h\u1ECDc \u0111\u1EA1i h\u1ECDc.
5. Kh\u1ED1i 05 (Kh\u1ED1i H\u1ED7 tr\u1EE3 - hotro@alcrewmanning.vn): An to\xE0n OHS; h\u1ED7 tr\u1EE3 lao \u0111\u1ED9ng v\u1EC1 n\u01B0\u1EDBc thanh l\xFD h\u1EE3p \u0111\u1ED3ng, b\u1EA3o hi\u1EC3m P&I, k\u1EBFt n\u1ED1i t\xE1i h\xF2a nh\u1EADp; k\u1EBF to\xE1n h\xE0nh ch\xEDnh.

TI\xCAU CHU\u1EA8N THUY\u1EC0N VI\xCAN & CH\u1EE8NG CH\u1EC8 STCW:
- Thuy\u1EC1n tr\u01B0\u1EDFng (Master): B\u1EB1ng Thuy\u1EC1n tr\u01B0\u1EDFng h\u1EA1ng 1 (STCW II/2), kinh nghi\u1EC7m t\u1ED1i thi\u1EC3u 18 th\xE1ng t\xE0u d\u1EA7u/h\xF3a ch\u1EA5t, ti\u1EBFng Anh l\u01B0u lo\xE1t, qua vetting/SIRE. L\u01B0\u01A1ng: $5,500 - $6,800/th\xE1ng.
- M\xE1y tr\u01B0\u1EDFng (Chief Engineer): B\u1EB1ng M\xE1y tr\u01B0\u1EDFng h\u1EA1ng 1 (STCW III/2), kinh nghi\u1EC7m m\xE1y MAN B&W/Sulzer. L\u01B0\u01A1ng: $5,200 - $6,500/th\xE1ng.
- Th\u1EE7y th\u1EE7 AB: Ch\u1EE9ng ch\u1EC9 STCW II/4 ho\u1EB7c II/5, hu\u1EA5n luy\u1EC7n an to\xE0n c\u01A1 b\u1EA3n, hu\u1EA5n luy\u1EC7n t\xE0u d\u1EA7u c\u01A1 b\u1EA3n. L\u01B0\u01A1ng: 26 - 32 tri\u1EC7u VN\u0110/th\xE1ng.
- Th\u1EE3 m\xE1y Oiler: STCW III/4 ho\u1EB7c III/5. L\u01B0\u01A1ng: $1,100 - $1,400/th\xE1ng.

CH\xCDNH S\xC1CH B\u1EA2O M\u1EACT & QUY\u1EC0N L\u1EE2I:
- Cam k\u1EBFt tu\xE2n th\u1EE7 Ngh\u1ECB \u0111\u1ECBnh 13/2023/N\u0110-CP: B\u1EA3o m\u1EADt 100% d\u1EEF li\u1EC7u c\xE1 nh\xE2n, truy\u1EC1n t\u1EA3i m\xE3 h\xF3a, kh\xF4ng cung c\u1EA5p cho b\xEAn th\u1EE9 ba.
- M\u1ED7i h\u1ED3 s\u01A1 g\u1EEDi online \u0111\u1EC1u c\xF3 "M\xE3 h\u1ED3 s\u01A1 b\u1EA3o m\u1EADt" (VD: ALCM-SEC-7829-9182) v\xE0 "M\xE3 PIN 4 s\u1ED1" \u0111\u1EC3 \u1EE9ng vi\xEAn t\u1EF1 tra c\u1EE9u ti\u1EBFn \u0111\u1ED9 \u0111\u1ED9c l\u1EADp t\u1EA1i m\u1EE5c "Tra c\u1EE9u h\u1ED3 s\u01A1" tr\xEAn website.
- Cam k\u1EBFt 4 "Kh\xF4ng": KH\xD4NG thu ph\xED m\xF4i gi\u1EDBi tr\xE1i ph\xE9p t\u1EEB thuy\u1EC1n vi\xEAn (chu\u1EA9n MLC 2006); KH\xD4NG gi\u1EEF gi\u1EA5y t\u1EDD g\u1ED1c tr\xE1i lu\u1EADt; KH\xD4NG cung c\u1EA5p sai th\xF4ng tin; B\u1EA2O M\u1EACT th\xF4ng tin tuy\u1EC7t \u0111\u1ED1i.

CH\u01AF\u01A0NG TR\xCCNH GI\u1EDAI THI\u1EC6U THUY\u1EC0N VI\xCAN & B\u1EA0N B\xC8 (REFERRAL PROGRAM):
- D\xE0nh cho thuy\u1EC1n vi\xEAn \u0111ang \u0111i t\xE0u, lao \u0111\u1ED9ng \u0111ang \u1EDF n\u01B0\u1EDBc ngo\xE0i, c\u1EF1u thuy\u1EC1n vi\xEAn ALCM ho\u1EB7c ng\u01B0\u1EDDi quen.
- M\u1EE9c th\u01B0\u1EDFng: S\u0129 quan qu\u1EA3n l\xFD (Thuy\u1EC1n tr\u01B0\u1EDFng, M\xE1y tr\u01B0\u1EDFng) 12 - 15 tri\u1EC7u VN\u0110/ng\u01B0\u1EDDi; S\u0129 quan v\u1EADn h\xE0nh (\u0110\u1EA1i ph\xF3, M\xE1y 2, Ph\xF3 2, Ph\xF3 3, ETO) 5 - 10 tri\u1EC7u VN\u0110/ng\u01B0\u1EDDi; Th\u1EE7y th\u1EE7 AB, Th\u1EE3 m\xE1y Oiler 3 - 4.5 tri\u1EC7u VN\u0110/ng\u01B0\u1EDDi; K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n / \u0110i\u1EC1u d\u01B0\u1EE1ng \u0110\u1EE9c 5 - 8 tri\u1EC7u VN\u0110/ng\u01B0\u1EDDi.
- Ti\u1EC1n th\u01B0\u1EDFng \u0111\u01B0\u1EE3c ALCM chi tr\u1EA3 100% t\u1EEB qu\u1EF9 ph\xFAc l\u1EE3i ngay khi \u1EE9ng vi\xEAn ho\xE0n t\u1EA5t k\xFD H\u0110L\u0110 v\xE0 l\xEAn t\xE0u (sign-on). Kh\xF4ng tr\u1EEB v\xE0o l\u01B0\u01A1ng \u1EE9ng vi\xEAn (chu\u1EA9n MLC 2006).
- Ng\u01B0\u1EDDi d\xF9ng c\xF3 th\u1EC3 k\xE9o xu\u1ED1ng m\u1EE5c "Ch\u01B0\u01A1ng tr\xECnh Gi\u1EDBi thi\u1EC7u Thuy\u1EC1n vi\xEAn" (#referral) tr\xEAn website \u0111\u1EC3 \u0111i\u1EC1n form gi\u1EDBi thi\u1EC7u, t\xEDnh nhanh ti\u1EC1n th\u01B0\u1EDFng ho\u1EB7c tra c\u1EE9u ti\u1EBFn \u0111\u1ED9.

L\u1ECACH PH\u1ECENG V\u1EA4N TR\u1EF0C TI\u1EBEP & H\u1ED8I TH\u1EA2O H\u01AF\u1EDANG NGHI\u1EC6P S\u1EAEP T\u1EDAI:
1. 18/10/2026 (08:30 - 16:30): Ph\u1ECFng v\u1EA5n Tr\u1EF1c ti\u1EBFp S\u0129 quan & Thuy\u1EC1n vi\xEAn T\xE0u d\u1EA7u c\xF9ng Ch\u1EE7 t\xE0u Daiichi Chuo Shipping (Nh\u1EADt B\u1EA3n) t\u1EA1i Tr\u1EE5 s\u1EDF TP.HCM & Zoom.
2. 24/10/2026 (09:00 - 11:30): H\u1ED9i th\u1EA3o H\u01B0\u1EDBng nghi\u1EC7p Visa K\u1EF9 s\u01B0 C\u01A1 kh\xED & T\u1EF1 \u0111\u1ED9ng ho\xE1 Nh\u1EADt B\u1EA3n (l\u01B0\u01A1ng 42-58 tr/th\xE1ng, b\u1EA3o l\xE3nh gia \u0111\xECnh).
3. 29/10/2026 (13:30 - 17:30): Ph\u1ECFng v\u1EA5n Tuy\u1EC3n ch\u1ECDn Tr\u1ECDn b\u1ED9 Thuy\u1EC1n b\u1ED9 T\xE0u H\xF3a ch\u1EA5t Singapore 25,000 DWT (nh\u1EADn t\xE0u Jurong th\xE1ng 12/2026).
4. 04/11/2026 (08:30 - 12:00): Ng\xE0y h\u1ED9i \u0110\u1ECBnh h\u01B0\u1EDBng Du h\u1ECDc Ngh\u1EC1 & \u0110i\u1EC1u d\u01B0\u1EE1ng Vi\xEAn CHLB \u0110\u1EE9c (mi\u1EC5n 100% h\u1ECDc ph\xED, tr\u1EE3 c\u1EA5p 28-36 tr/th\xE1ng).
5. 10/11/2026 (14:00 - 17:30): Workshop C\u1EADp nh\u1EADt Ti\xEAu chu\u1EA9n Vetting SIRE 2.0 & An to\xE0n H\xE0ng h\u1EA3i tr\xEAn Bu\u1ED3ng l\xE1i m\xF4 ph\u1ECFng 360 \u0111\u1ED9 (Kh\u1ED1i 02).
- Thuy\u1EC1n vi\xEAn \u1EDF xa ho\u1EB7c tr\xEAn bi\u1EC3n c\xF3 th\u1EC3 \u0111\u0103ng k\xFD tham gia ph\u1ECFng v\u1EA5n 100% online qua Zoom Meeting. Ng\u01B0\u1EDDi d\xF9ng c\xF3 th\u1EC3 nh\u1EA5n v\xE0o m\u1EE5c "L\u1ECBch ph\u1ECFng v\u1EA5n & H\u1ED9i th\u1EA3o" (#events) tr\xEAn trang web \u0111\u1EC3 \u0111\u0103ng k\xFD gi\u1EEF ch\u1ED7 v\xE0 l\u1EA5y v\xE9 m\u1EDDi \u0111i\u1EC7n t\u1EED mi\u1EC5n ph\xED.

H\u01AF\u1EDANG D\u1EAAN \u1EE8NG VI\xCAN:
- Khuy\xEAn ng\u01B0\u1EDDi d\xF9ng c\xF3 th\u1EC3 nh\u1EA5n n\xFAt "G\u1EEDi CV / \u0110\u0103ng k\xFD" m\xE0u xanh \u0111\u1EADm tr\xEAn thanh menu \u0111\u1EC3 n\u1ED9p h\u1ED3 s\u01A1 tr\u1EF1c tuy\u1EBFn ho\u1EB7c \u0111\xEDnh k\xE8m file CV.
- H\u01B0\u1EDBng d\u1EABn d\xF9ng t\xEDnh n\u0103ng "Tra c\u1EE9u h\u1ED3 s\u01A1" n\u1EBFu h\u1ECD \u0111\xE3 n\u1ED9p v\xE0 c\xF3 M\xE3 h\u1ED3 s\u01A1 + PIN.
- Khi h\u1ECFi v\u1EC1 l\u1ECBch ph\u1ECFng v\u1EA5n ho\u1EB7c h\u1ED9i th\u1EA3o, h\u01B0\u1EDBng d\u1EABn xem chi ti\u1EBFt v\xE0 \u0111\u0103ng k\xFD t\u1EA1i m\u1EE5c "L\u1ECBch ph\u1ECFng v\u1EA5n & H\u1ED9i th\u1EA3o" (#events).
- Khi h\u1ECFi v\u1EC1 gi\u1EDBi thi\u1EC7u thuy\u1EC1n vi\xEAn nh\u1EADn th\u01B0\u1EDFng, h\u01B0\u1EDBng d\u1EABn \u0111\u1EBFn m\u1EE5c "Ch\u01B0\u01A1ng tr\xECnh Gi\u1EDBi thi\u1EC7u Thuy\u1EC1n vi\xEAn" (#referral).
- Khi c\u1EA7n trao \u0111\u1ED5i tr\u1EF1c ti\u1EBFp, h\xE3y h\u01B0\u1EDBng d\u1EABn g\u1ECDi Hotline 0903 396 466 ho\u1EB7c t\u1EDBi v\u0103n ph\xF2ng 117 Nguy\u1EC5n C\u1EEDu V\xE2n, P.17, B\xECnh Th\u1EA1nh.
- Tr\u1EA3 l\u1EDDi b\u1EB1ng ti\u1EBFng Vi\u1EC7t l\u1ECBch s\u1EF1, s\xFAc t\xEDch, r\xF5 r\xE0ng, g\u1EA1ch \u0111\u1EA7u d\xF2ng m\u1EA1ch l\u1EA1c v\xE0 th\u1EF1c t\u1EBF.
`;
app.get("/api/admin/applications", requireAdmin, async (_req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 t\u1EA3i d\u1EEF li\u1EC7u h\u1ED3 s\u01A1." });
    return;
  }
  try {
    const records = await listApplications();
    res.json({ applications: records });
  } catch (error) {
    console.error("List applications error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch h\u1ED3 s\u01A1." });
  }
});
app.get("/api/admin/customer-interactions", requireAdmin, async (_req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 t\u1EA3i d\u1EEF li\u1EC7u kh\xE1ch h\xE0ng." });
    return;
  }
  try {
    const [contacts, referrals, eventRegistrations] = await Promise.all([
      listContactMessages(),
      listReferrals(),
      listEventRegistrations()
    ]);
    res.json({ contacts, referrals, eventRegistrations });
  } catch (error) {
    console.error("List customer interactions error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 t\u1EA3i d\u1EEF li\u1EC7u t\u01B0\u01A1ng t\xE1c kh\xE1ch h\xE0ng." });
  }
});
app.patch("/api/admin/applications/:id/status", requireAdmin, async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt h\u1ED3 s\u01A1." });
    return;
  }
  const status = req.body?.status;
  if (typeof status !== "string" || !Object.prototype.hasOwnProperty.call(applicationStatusProgress, status)) {
    res.status(400).json({ error: "Tr\u1EA1ng th\xE1i h\u1ED3 s\u01A1 kh\xF4ng h\u1EE3p l\u1EC7." });
    return;
  }
  const statusProgress = applicationStatusProgress[status];
  try {
    const record = await findApplicationById(req.params.id);
    if (!record) {
      res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1 \u1EE9ng tuy\u1EC3n." });
      return;
    }
    await updateApplicationStatus(req.params.id, status, statusProgress);
    res.json({ success: true, status, statusProgress });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i h\u1ED3 s\u01A1." });
  }
});
app.get("/api/admin/applications/:id/cv", requireAdmin, async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 t\u1EA3i t\u1EC7p CV." });
    return;
  }
  try {
    const record = await findApplicationById(req.params.id);
    if (!record?.cvFilePath) {
      res.status(404).json({ error: "H\u1ED3 s\u01A1 kh\xF4ng c\xF3 t\u1EC7p CV." });
      return;
    }
    const storedFilename = path.basename(record.cvFilePath);
    const filePath = path.join(uploadsDir, storedFilename);
    if (!storedFilename || !fs.existsSync(filePath)) {
      res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y t\u1EC7p CV." });
      return;
    }
    res.download(filePath, path.basename(record.cvFileName || storedFilename));
  } catch (error) {
    console.error("Download application CV error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 t\u1EA3i t\u1EC7p CV." });
  }
});
app.post("/api/applications", (req, res, next) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; h\u1ED3 s\u01A1 ch\u01B0a \u0111\u01B0\u1EE3c l\u01B0u. Vui l\xF2ng th\u1EED l\u1EA1i sau." });
    return;
  }
  next();
}, upload.single("cvFile"), async (req, res) => {
  try {
    const record = req.body && Object.keys(req.body).length > 0 ? req.body : void 0;
    const uploadedRecord = {
      ...record || {},
      ...req.file ? {
        cvFileName: req.file.originalname,
        cvFileSize: `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`,
        cvFilePath: `/uploads/${req.file.filename}`
      } : {}
    };
    const normalizedRecord = {
      id: uploadedRecord.id,
      pin: uploadedRecord.pin,
      fullName: uploadedRecord.fullName,
      phone: uploadedRecord.phone,
      email: uploadedRecord.email,
      positionTitle: uploadedRecord.positionTitle,
      divisionId: uploadedRecord.divisionId,
      cvFileName: uploadedRecord.cvFileName || void 0,
      cvFileSize: uploadedRecord.cvFileSize || void 0,
      cvFilePath: uploadedRecord.cvFilePath || void 0,
      experienceYears: Number(uploadedRecord.experienceYears || 0),
      languageLevel: uploadedRecord.languageLevel || "",
      submittedAt: uploadedRecord.submittedAt || (/* @__PURE__ */ new Date()).toISOString(),
      status: uploadedRecord.status || "\u0110\xE3 ti\u1EBFp nh\u1EADn",
      statusProgress: Number(uploadedRecord.statusProgress || 20),
      notes: uploadedRecord.notes || "",
      assignedOfficer: uploadedRecord.assignedOfficer || "",
      departmentEmail: uploadedRecord.departmentEmail || ""
    };
    if (!normalizedRecord.id || !normalizedRecord.fullName || !normalizedRecord.email || !normalizedRecord.phone) {
      res.status(400).json({ error: "D\u1EEF li\u1EC7u h\u1ED3 s\u01A1 kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    await saveApplication(normalizedRecord);
    res.status(201).json({ success: true, record: normalizedRecord });
  } catch (error) {
    console.error("Save application error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u01B0u h\u1ED3 s\u01A1 v\xE0o database." });
  }
});
app.get("/api/applications/track", async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 tra c\u1EE9u h\u1ED3 s\u01A1." });
    return;
  }
  try {
    const { id, pin } = req.query;
    if (typeof id !== "string" || typeof pin !== "string") {
      res.status(400).json({ error: "Thi\u1EBFu m\xE3 h\u1ED3 s\u01A1 ho\u1EB7c m\xE3 PIN." });
      return;
    }
    const record = await findApplicationByIdAndPin(id, pin);
    if (!record) {
      res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y h\u1ED3 s\u01A1." });
      return;
    }
    res.json({ application: record });
  } catch (error) {
    console.error("Track application error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 tra c\u1EE9u h\u1ED3 s\u01A1." });
  }
});
app.post("/api/contact", async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; y\xEAu c\u1EA7u ch\u01B0a \u0111\u01B0\u1EE3c l\u01B0u. Vui l\xF2ng th\u1EED l\u1EA1i sau." });
    return;
  }
  try {
    const payload = req.body;
    if (!payload || !payload.name || !payload.phone || !payload.email) {
      res.status(400).json({ error: "Th\xF4ng tin li\xEAn h\u1EC7 kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    const result = await saveContactMessage(payload);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error("Save contact error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u01B0u tin nh\u1EAFn li\xEAn h\u1EC7." });
  }
});
app.post("/api/referrals", async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; gi\u1EDBi thi\u1EC7u ch\u01B0a \u0111\u01B0\u1EE3c l\u01B0u. Vui l\xF2ng th\u1EED l\u1EA1i sau." });
    return;
  }
  try {
    const payload = req.body;
    if (!payload || !payload.referrerName || !payload.referrerPhone || !payload.candidateName || !payload.candidatePhone) {
      res.status(400).json({ error: "Th\xF4ng tin gi\u1EDBi thi\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    const trackingCode = `REF-ALCM-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const result = await saveReferral({ ...payload, trackingCode });
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error("Save referral error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u01B0u th\xF4ng tin gi\u1EDBi thi\u1EC7u." });
  }
});
app.post("/api/event-registrations", async (req, res) => {
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; \u0111\u0103ng k\xFD ch\u01B0a \u0111\u01B0\u1EE3c l\u01B0u. Vui l\xF2ng th\u1EED l\u1EA1i sau." });
    return;
  }
  try {
    const payload = req.body;
    if (!payload || !payload.eventName || !payload.fullName || !payload.email || !payload.phone) {
      res.status(400).json({ error: "Th\xF4ng tin \u0111\u0103ng k\xFD s\u1EF1 ki\u1EC7n kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    const result = await saveEventRegistration(payload);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error("Save event registration error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 l\u01B0u \u0111\u0103ng k\xFD s\u1EF1 ki\u1EC7n." });
  }
});
app.get("/api/event-registrations/lookup", async (req, res) => {
  const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : "";
  const email = typeof req.query.email === "string" ? req.query.email.trim() : "";
  if (!phone || !email) {
    res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp s\u1ED1 \u0111i\u1EC7n tho\u1EA1i v\xE0 email \u0111\xE3 d\xF9ng \u0111\u0103ng k\xFD." });
    return;
  }
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 tra c\u1EE9u v\xE9." });
    return;
  }
  try {
    const registrations = await findEventRegistrationsByContact(phone, email);
    res.json({ registrations });
  } catch (error) {
    console.error("Lookup event registrations error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 tra c\u1EE9u v\xE9 s\u1EF1 ki\u1EC7n." });
  }
});
app.get("/api/referrals/track", async (req, res) => {
  const trackingCode = typeof req.query.code === "string" ? req.query.code.trim() : "";
  if (!trackingCode) {
    res.status(400).json({ error: "Vui l\xF2ng nh\u1EADp m\xE3 gi\u1EDBi thi\u1EC7u." });
    return;
  }
  if (!databaseReady) {
    res.status(503).json({ error: "MySQL ch\u01B0a s\u1EB5n s\xE0ng; kh\xF4ng th\u1EC3 tra c\u1EE9u gi\u1EDBi thi\u1EC7u." });
    return;
  }
  try {
    const referral = await findReferralByTrackingCode(trackingCode);
    if (!referral) {
      res.status(404).json({ error: "Kh\xF4ng t\xECm th\u1EA5y m\xE3 gi\u1EDBi thi\u1EC7u." });
      return;
    }
    res.json({ referral });
  } catch (error) {
    console.error("Track referral error:", error);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 tra c\u1EE9u gi\u1EDBi thi\u1EC7u." });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, language } = req.body;
    const chatLanguageNames = {
      vi: "Vietnamese",
      en: "English",
      ja: "Japanese",
      ko: "Korean",
      zh: "Simplified Chinese"
    };
    const requestedLanguage = Object.hasOwn(chatLanguageNames, language) ? language : "vi";
    const localizedUnavailable = {
      en: "The AI assistant is temporarily unavailable. Please use the application button or call 0903 396 466 (24/7) for help.",
      ja: "AI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u306F\u4E00\u6642\u7684\u306B\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u5FDC\u52DF\u30DC\u30BF\u30F3\u3092\u4F7F\u3046\u304B\u30010903 396 466\uFF0824\u6642\u9593\uFF09\u3078\u304A\u96FB\u8A71\u304F\u3060\u3055\u3044\u3002",
      ko: "AI \uC0C1\uB2F4\uC744 \uC77C\uC2DC\uC801\uC73C\uB85C \uC774\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C0\uC6D0 \uBC84\uD2BC\uC744 \uC774\uC6A9\uD558\uAC70\uB098 0903 396 466(24\uC2DC\uAC04)\uC73C\uB85C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.",
      zh: "AI\u987E\u95EE\u6682\u65F6\u65E0\u6CD5\u4F7F\u7528\u3002\u8BF7\u70B9\u51FB\u7533\u8BF7\u6309\u94AE\uFF0C\u6216\u62E8\u6253 0903 396 466\uFF08\u5168\u5929\u5019\uFF09\u83B7\u53D6\u5E2E\u52A9\u3002"
    };
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Tin nh\u1EAFn kh\xF4ng h\u1EE3p l\u1EC7." });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      if (requestedLanguage !== "vi") {
        res.json({ reply: localizedUnavailable[requestedLanguage] });
        return;
      }
      const lower = message.toLowerCase();
      let reply2 = "Ch\xE0o b\u1EA1n! T\xF4i l\xE0 Tr\u1EE3 l\xFD AI c\u1EE7a \xC2u L\u1EA1c Crew Manning (ALCM). ";
      if (lower.includes("l\u1ECBch") || lower.includes("ph\u1ECFng v\u1EA5n") || lower.includes("h\u1ED9i th\u1EA3o") || lower.includes("s\u1EF1 ki\u1EC7n")) {
        reply2 += 'V\u1EC1 L\u1ECBch Ph\u1ECFng V\u1EA5n & H\u1ED9i Th\u1EA3o s\u1EAFp t\u1EDBi:\n\u2022 18/10/2026: Ph\u1ECFng v\u1EA5n tr\u1EF1c ti\u1EBFp S\u0129 quan t\xE0u d\u1EA7u c\xF9ng Ch\u1EE7 t\xE0u Nh\u1EADt B\u1EA3n (Daiichi Chuo)\n\u2022 24/10/2026: H\u1ED9i th\u1EA3o K\u1EF9 s\u01B0 C\u01A1 kh\xED/T\u1EF1 \u0111\u1ED9ng ho\xE1 Nh\u1EADt B\u1EA3n (l\u01B0\u01A1ng 42-58 tr/th\xE1ng)\n\u2022 29/10/2026: Tuy\u1EC3n tr\u1ECDn b\u1ED9 Thuy\u1EC1n vi\xEAn t\xE0u H\xF3a ch\u1EA5t Singapore 25,000 DWT\n\u2022 04/11/2026: Ng\xE0y h\u1ED9i Du h\u1ECDc ngh\u1EC1 \u0110i\u1EC1u d\u01B0\u1EE1ng \u0110\u1EE9c (mi\u1EC5n ph\xED 100% h\u1ECDc ph\xED)\nB\u1EA1n c\xF3 th\u1EC3 l\u01B0\u1EDBt \u0111\u1EBFn m\u1EE5c "L\u1ECBch ph\u1ECFng v\u1EA5n & H\u1ED9i th\u1EA3o" tr\xEAn website \u0111\u1EC3 \u0111\u0103ng k\xFD nh\u1EADn v\xE9 m\u1EDDi \u0111i\u1EC7n t\u1EED mi\u1EC5n ph\xED, ho\u1EB7c ch\u1ECDn tham gia Online qua Zoom!';
      } else if (lower.includes("gi\u1EDBi thi\u1EC7u") || lower.includes("th\u01B0\u1EDFng") || lower.includes("hoa h\u1ED3ng") || lower.includes("referral")) {
        reply2 += 'V\u1EC1 Ch\u01B0\u01A1ng tr\xECnh Gi\u1EDBi thi\u1EC7u Thuy\u1EC1n vi\xEAn & B\u1EA1n b\xE8: ALCM trao th\u01B0\u1EDFng t\u1EEB 3.000.000\u0111 \u0111\u1EBFn 15.000.000\u0111/thuy\u1EC1n vi\xEAn cho ng\u01B0\u1EDDi gi\u1EDBi thi\u1EC7u khi \u1EE9ng vi\xEAn k\xFD h\u1EE3p \u0111\u1ED3ng v\xE0 l\xEAn t\xE0u th\xE0nh c\xF4ng (Thuy\u1EC1n tr\u01B0\u1EDFng/M\xE1y tr\u01B0\u1EDFng: 12-15 tri\u1EC7u; S\u0129 quan: 5-10 tri\u1EC7u; Th\u1EE7y th\u1EE7/Th\u1EE3 m\xE1y: 3-4.5 tri\u1EC7u; K\u1EF9 s\u01B0 XKL\u0110: 5-8 tri\u1EC7u). B\u1EA1n c\xF3 th\u1EC3 l\u01B0\u1EDBt \u0111\u1EBFn m\u1EE5c "Gi\u1EDBi thi\u1EC7u nh\u1EADn th\u01B0\u1EDFng" tr\xEAn trang ch\u1EE7 \u0111\u1EC3 \u0111i\u1EC1n th\xF4ng tin v\xE0 l\u1EA5y m\xE3 theo d\xF5i!';
      } else if (lower.includes("stcw") || lower.includes("ch\u1EE9ng ch\u1EC9") || lower.includes("hu\u1EA5n luy\u1EC7n")) {
        reply2 += 'V\u1EC1 ch\u1EE9ng ch\u1EC9 STCW: Trung t\xE2m Hu\u1EA5n luy\u1EC7n \xC2u L\u1EA1c (Kh\u1ED1i 02) \u0111\xE0o t\u1EA1o an to\xE0n c\u01A1 b\u1EA3n (4 ch\u1EE9ng ch\u1EC9), ch\u1EEFa ch\xE1y n\xE2ng cao, c\u1EE9u sinh, s\u01A1 c\u1EE9u y t\u1EBF v\xE0 ti\u1EBFng Anh h\xE0ng h\u1EA3i. B\u1EA1n c\xF3 th\u1EC3 nh\u1EA5n n\xFAt "G\u1EEDi CV / \u0110\u0103ng k\xFD" tr\xEAn website ho\u1EB7c li\xEAn h\u1EC7 hotline 0903 396 466 \u0111\u1EC3 x\u1EBFp l\u1EDBp nhanh nh\u1EA5t.';
      } else if (lower.includes("thuy\u1EC1n tr\u01B0\u1EDFng") || lower.includes("l\u01B0\u01A1ng") || lower.includes("m\xE1y tr\u01B0\u1EDFng") || lower.includes("th\u1EE7y th\u1EE7")) {
        reply2 += "V\u1EC1 v\u1ECB tr\xED Thuy\u1EC1n vi\xEAn: ALCM \u0111ang tuy\u1EC3n Thuy\u1EC1n tr\u01B0\u1EDFng t\xE0u d\u1EA7u ($5,500 - $6,800/th\xE1ng), M\xE1y tr\u01B0\u1EDFng ($5,200 - $6,500/th\xE1ng), Th\u1EE7y th\u1EE7 AB (26 - 32 tr/th\xE1ng) v\xE0 Th\u1EE3 m\xE1y ($1,100 - $1,400/th\xE1ng). H\u1EE3p \u0111\u1ED3ng \u0111\u1EA1t chu\u1EA9n MLC 2006, \u0111\xE0i th\u1ECD v\xE9 m\xE1y bay v\xE0 b\u1EA3o hi\u1EC3m P&I.";
      } else if (lower.includes("nh\u1EADt") || lower.includes("\u0111\u1EE9c") || lower.includes("k\u1EF9 s\u01B0") || lower.includes("\u0111i\u1EC1u d\u01B0\u1EE1ng")) {
        reply2 += "V\u1EC1 c\u01A1 h\u1ED9i ngh\u1EC1 nghi\u1EC7p v\xE0 xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng (Kh\u1ED1i 03): ALCM \u0111ang m\u1EDF r\u1ED9ng tuy\u1EC3n d\u1EE5ng K\u1EF9 s\u01B0 c\u01A1 kh\xED \u0111i Nh\u1EADt B\u1EA3n (42-58 tr/th\xE1ng, b\u1EA3o l\xE3nh gia \u0111\xECnh) v\xE0 \u0110i\u1EC1u d\u01B0\u1EE1ng vi\xEAn sang CHLB \u0110\u1EE9c (65-85 tr/th\xE1ng, h\u1ECDc b\u1ED5ng ti\u1EBFng \u0110\u1EE9c B1/B2 v\xE0 c\u01A1 h\u1ED9i \u0111\u1ECBnh c\u01B0 sau 3 n\u0103m).";
      } else if (lower.includes("b\u1EA3o m\u1EADt") || lower.includes("tra c\u1EE9u") || lower.includes("pin")) {
        reply2 += "V\u1EC1 b\u1EA3o m\u1EADt: D\u1EEF li\u1EC7u h\u1ED3 s\u01A1 c\u1EE7a b\u1EA1n \u0111\u01B0\u1EE3c m\xE3 h\xF3a theo Ngh\u1ECB \u0111\u1ECBnh 13/2023/N\u0110-CP. Sau khi n\u1ED9p h\u1ED3 s\u01A1 tr\xEAn website, b\u1EA1n s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c M\xE3 h\u1ED3 s\u01A1 (VD: ALCM-SEC-xxxx) v\xE0 t\u1EF1 \u0111\u1EB7t m\xE3 PIN 4 s\u1ED1 \u0111\u1EC3 theo d\xF5i ti\u1EBFn \u0111\u1ED9 x\xE9t duy\u1EC7t b\u1EA3o m\u1EADt.";
      } else if (lower.includes("\u0111\xE1nh gi\xE1") || lower.includes("c\u1EA3m nh\u1EADn") || lower.includes("review") || lower.includes("uy t\xEDn")) {
        reply2 += 'V\u1EC1 \u0111\xE1nh gi\xE1 v\xE0 c\u1EA3m nh\u1EADn: ALCM \u0111\xE3 \u0111i\u1EC1u \u0111\u1ED9ng h\u01A1n 1.200 thuy\u1EC1n vi\xEAn v\xE0 k\u1EF9 s\u01B0 th\xE0nh c\xF4ng v\u1EDBi t\u1EF7 l\u1EC7 t\xE1i k\xFD h\u1EE3p \u0111\u1ED3ng \u0111\u1EA1t 98.6%. B\u1EA1n c\xF3 th\u1EC3 xem c\xE1c \u0111\xE1nh gi\xE1 5 sao t\u1EEB Thuy\u1EC1n tr\u01B0\u1EDFng, M\xE1y hai, S\u0129 quan \u0111i\u1EC7n v\xE0 K\u1EF9 s\u01B0 Nh\u1EADt B\u1EA3n t\u1EA1i m\u1EE5c "C\u1EA3m Nh\u1EADn Thuy\u1EC1n Vi\xEAn" ngay tr\xEAn trang ch\u1EE7 website!';
      } else {
        reply2 += 'ALCM chuy\xEAn cung \u1EE9ng Thuy\u1EC1n vi\xEAn vi\u1EC5n d\u01B0\u01A1ng chu\u1EA9n MLC 2006, xu\u1EA5t kh\u1EA9u lao \u0111\u1ED9ng k\u1EF9 thu\u1EADt cao (Nh\u1EADt B\u1EA3n, \u0110\u1EE9c) v\xE0 \u0111\xE0o t\u1EA1o STCW. B\u1EA1n c\xF3 th\u1EC3 g\u1EEDi h\u1ED3 s\u01A1 online qua n\xFAt "G\u1EEDi CV / \u0110\u0103ng k\xFD" tr\xEAn website ho\u1EB7c g\u1ECDi Hotline 0903 396 466 \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3 tr\u1EF1c ti\u1EBFp!';
      }
      res.json({ reply: reply2 });
      return;
    }
    const contents = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role === "user" || item.role === "model") {
          contents.push({
            role: item.role,
            parts: [{ text: item.content || item.text || "" }]
          });
        }
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: `${ALCM_SYSTEM_INSTRUCTION}

Reply only in ${chatLanguageNames[requestedLanguage]}. Keep company names and maritime acronyms unchanged.`,
        temperature: 0.7
      }
    });
    const reply = response.text || "Xin l\u1ED7i, hi\u1EC7n t\u1EA1i t\xF4i ch\u01B0a th\u1EC3 ph\u1EA3n h\u1ED3i. Vui l\xF2ng li\xEAn h\u1EC7 hotline 0903 396 466 \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3.";
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i \u0111\u1EBFn AI Consultant. Vui l\xF2ng th\u1EED l\u1EA1i sau ho\u1EB7c g\u1ECDi hotline 0903 396 466."
    });
  }
});
function listenWithFallback(port) {
  const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
      listenWithFallback(nextPort);
      return;
    }
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}
async function startServer() {
  await initializeDatabase();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  listenWithFallback(defaultPort);
}
startServer();
