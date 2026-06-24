# -*- coding: utf-8 -*-
"""
generate_erd.py
Membuat diagram ERD (Entity Relationship Diagram) basis data
TechSolve SIA dan menyimpannya sebagai database/ERD.png.

Cara pakai:
    pip install matplotlib
    python generate_erd.py
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch

# Warna
C_HEADER = "#1d4ed8"   # biru header entitas
C_BORDER = "#334155"   # garis tepi
C_DIV = "#e2e8f0"      # garis pemisah baris
C_TRIG = "#dc2626"     # merah untuk relasi via trigger
C_FK = "#64748b"       # abu untuk relasi FK sekunder

RH = 3.1   # tinggi baris
HH = 4.2   # tinggi header


def draw_entity(ax, x, top, w, title, fields):
    """Gambar satu entitas (tabel). fields: list (nama, tag)."""
    n = len(fields)
    total_h = HH + n * RH
    bottom = top - total_h
    # badan
    ax.add_patch(Rectangle((x, bottom), w, total_h, facecolor="white",
                           edgecolor=C_BORDER, lw=1.5, zorder=2))
    # header
    ax.add_patch(Rectangle((x, top - HH), w, HH, facecolor=C_HEADER,
                           edgecolor=C_BORDER, lw=1.5, zorder=3))
    ax.text(x + w / 2, top - HH / 2, title, ha="center", va="center",
            color="white", fontsize=10.5, fontweight="bold",
            family="monospace", zorder=4)
    # baris field
    for i, (name, tag) in enumerate(fields):
        ry = top - HH - (i + 0.5) * RH
        prefix = {"pk": "PK  ", "fk": "FK  ", "pkfk": "PK,FK ", "": "      "}[tag]
        weight = "bold" if "pk" in tag else "normal"
        ax.text(x + 1.2, ry, prefix + name, ha="left", va="center",
                fontsize=8.3, fontweight=weight, family="monospace", zorder=4)
        if i < n - 1:
            yy = top - HH - (i + 1) * RH
            ax.plot([x, x + w], [yy, yy], color=C_DIV, lw=0.6, zorder=3)
    # kembalikan posisi penting untuk menyambung relasi
    return {"x": x, "right": x + w, "top": top, "bottom": bottom,
            "cx": x + w / 2, "w": w}


def rel(ax, p1, p2, label, one_one=False, color=C_BORDER, dashed=False,
        l1="1", l2="N"):
    """Gambar garis relasi antar dua titik + penanda kardinalitas.
    Label kardinalitas ditempatkan menjorok dari ujung & diberi offset
    tegak lurus agar tidak menimpa teks field."""
    style = (0, (5, 3)) if dashed else "solid"
    arrow = FancyArrowPatch(p1, p2, arrowstyle="-", color=color, lw=1.6,
                            linestyle=style, zorder=1,
                            connectionstyle="arc3,rad=0")
    ax.add_patch(arrow)
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    length = (dx ** 2 + dy ** 2) ** 0.5 or 1
    ux, uy = dx / length, dy / length      # arah garis
    px, py = -uy, ux                        # tegak lurus
    off, inset = 2.0, 0.16                   # offset & jarak menjorok
    a = (p1[0] + ux * length * inset + px * off,
         p1[1] + uy * length * inset + py * off)
    b = (p2[0] - ux * length * inset + px * off,
         p2[1] - uy * length * inset + py * off)
    ax.text(a[0], a[1], l1, ha="center", va="center", fontsize=8.5,
            color=color, fontweight="bold", zorder=5)
    ax.text(b[0], b[1], (l1 if one_one else l2), ha="center", va="center",
            fontsize=8.5, color=color, fontweight="bold", zorder=5)
    # label relasi di tengah garis
    mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
    ax.text(mx, my, label, ha="center", va="center", fontsize=7.6,
            color=color, style="italic", zorder=5,
            bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="none"))


def main():
    fig, ax = plt.subplots(figsize=(12, 9.5), dpi=160)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # Judul
    ax.text(50, 98, "Entity Relationship Diagram — TechSolve Consulting (SIA)",
            ha="center", va="top", fontsize=13, fontweight="bold")

    # Entitas
    coa = draw_entity(ax, 4, 92, 30, "chart_of_accounts", [
        ("kode_akun", "pk"),
        ("nama_akun", ""),
        ("kategori", ""),
        ("saldo_normal", ""),
    ])
    trx = draw_entity(ax, 66, 92, 30, "transactions", [
        ("id", "pk"),
        ("tanggal", ""),
        ("deskripsi", ""),
        ("jenis_transaksi", ""),
        ("total_amount", ""),
    ])
    det = draw_entity(ax, 35, 64, 30, "transaction_details", [
        ("id", "pk"),
        ("transaction_id", "fk"),
        ("kode_akun", "fk"),
        ("debit", ""),
        ("kredit", ""),
    ])
    jur = draw_entity(ax, 32, 33, 36, "journal_entries", [
        ("id", "pk"),
        ("tanggal", ""),
        ("deskripsi", ""),
        ("kode_akun", "fk"),
        ("debit", ""),
        ("kredit", ""),
        ("ref_transaction_id", "fk"),
        ("ref_detail_id", "fk"),
    ])

    # Relasi utama
    # chart_of_accounts (1) --- (N) transaction_details
    rel(ax, (coa["cx"], coa["bottom"]), (det["x"], det["top"] - 2),
        "memiliki", color=C_BORDER)
    # transactions (1) --- (N) transaction_details
    rel(ax, (trx["cx"], trx["bottom"]), (det["right"], det["top"] - 2),
        "merinci", color=C_BORDER)
    # transaction_details (1) --- (1) journal_entries  [via TRIGGER]
    rel(ax, (det["cx"], det["bottom"]), (jur["cx"], jur["top"]),
        "AUTO via TRIGGER", one_one=True, color=C_TRIG)

    # Relasi FK sekunder ke journal_entries (garis putus-putus, lebih ringan)
    # chart_of_accounts (1) --- (N) journal_entries (kode_akun)
    rel(ax, (coa["x"] + 2, coa["bottom"]), (jur["x"], jur["top"] - 6),
        "FK kode_akun", color=C_FK, dashed=True)
    # transactions (1) --- (N) journal_entries (ref_transaction_id)
    rel(ax, (trx["right"] - 2, trx["bottom"]), (jur["right"], jur["top"] - 6),
        "FK ref_transaction_id", color=C_FK, dashed=True)

    # Legenda (di ruang kosong atas-tengah, antara dua tabel atas)
    lx, ltop = 35, 90
    ax.add_patch(Rectangle((lx, ltop - 12), 30, 12, facecolor="#f8fafc",
                           edgecolor=C_BORDER, lw=1.0, zorder=2))
    ax.text(lx + 1.5, ltop - 2, "Keterangan:", fontsize=8.5,
            fontweight="bold", va="center", zorder=3)
    ax.text(lx + 1.5, ltop - 4.6, "PK = Primary Key   FK = Foreign Key",
            fontsize=8, va="center", zorder=3)
    ax.plot([lx + 1.5, lx + 5.5], [ltop - 7.2, ltop - 7.2], color=C_TRIG,
            lw=1.8, zorder=3)
    ax.text(lx + 6.5, ltop - 7.2, "relasi via trigger (1:1)", fontsize=8,
            va="center", zorder=3)
    ax.plot([lx + 1.5, lx + 5.5], [ltop - 9.8, ltop - 9.8], color=C_FK,
            lw=1.8, linestyle=(0, (5, 3)), zorder=3)
    ax.text(lx + 6.5, ltop - 9.8, "relasi foreign key (1:N)", fontsize=8,
            va="center", zorder=3)

    plt.tight_layout()
    fig.savefig("ERD.png", bbox_inches="tight", facecolor="white")
    print("Berhasil membuat: ERD.png")


if __name__ == "__main__":
    main()
