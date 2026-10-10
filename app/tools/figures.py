"""Render selected chapter slides to compressed webp files in tools/figures/.

Run once (or after changing FIGURES); build_site.py embeds the cached files.
"""
import io
import os
import pymupdf
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(HERE, '..', 'pdf')
OUT_DIR = os.path.join(HERE, 'figures')

C1 = 'Chp1-Investment Environment.pdf'
C2 = 'Chp2-Securities Market Transactions.pdf'
C3 = 'Chp3-Investment Info  Securities Transactions.pdf'
C4 = 'Chp4-Return  Risk.pdf'
C4A = 'Chp4A-Time Value of Money.pdf'
C5 = 'Chp5-Modern Portfolio Concepts.pdf'

# key: (pdf, page, alt text, caption)
FIGURES = {
    # Chapter 1
    'l1_attrib': (C1, 4, 'Attributes of investments: securities or property, direct or indirect', 'Investments are classified along several attributes at once: securities or property, direct or indirect.'),
    'l1_flow': (C1, 9, 'Figure 1.2: suppliers of funds connected to demanders directly, through financial institutions and through financial markets', 'Funds flow from suppliers to demanders directly, through financial institutions or through financial markets.'),
    'l1_steps': (C1, 15, 'Steps in investing: meeting prerequisites and establishing goals', 'The first two steps come before any product is chosen: meet the prerequisites, then set goals.'),
    'l1_life': (C1, 24, 'Investing over the life cycle: growth-oriented youth, middle-age consolidation, income-oriented retirement', 'Investment philosophy shifts from growth, to consolidation, to income as investors age.'),
    'l1_short': (C1, 30, 'Advantages and disadvantages of short-term investments', 'Short-term investments buy liquidity and low default risk at the price of low return and inflation risk.'),
    'l1_scorecard': (C1, 38, 'Table 1.4: scorecard for short-term investments by availability, safety, liquidity and rate', 'No short-term instrument wins on availability, safety, liquidity and rate at the same time.'),
    # Chapter 2
    'l2_types': (C2, 4, 'Definitions of money, capital, primary and secondary markets', 'Two separate questions: how long until maturity, and has the security been issued before?'),
    'l2_ipo': (C2, 7, 'Going public: underwriting, prospectus, red herring, quiet period, road show', 'The IPO vocabulary: underwriting, prospectus, red herring, quiet period and road show.'),
    'l2_selling': (C2, 10, 'Figure 2.2: issuing firm, underwriting syndicate, selling group and purchasers of securities', 'A large issue flows from the issuer through the underwriting syndicate and selling group to investors.'),
    'l2_markets': (C2, 13, 'Figure 2.3: secondary market split into broker markets and dealer markets', 'Secondary markets split into broker markets (exchanges) and dealer markets (Nasdaq, OTC).'),
    'l2_margin_formula': (C2, 31, 'Basic margin formula: (value of securities minus debit balance) divided by value of securities', 'Margin = (V − D) / V: the share of the position that is the investor\'s own equity.'),
    'l2_margin_table': (C2, 32, 'Table 2.3: the effect of margin trading on security returns', 'The lower the margin, the larger the percentage gain or loss on the investor\'s equity.'),
    'l2_short_table': (C2, 36, 'Table 2.5: the mechanics of a short sale, borrowing at 50 and covering at 30', 'Sell borrowed shares at $50, buy them back at $30, return them: a $2,000 profit.'),
    'l2_short_margin': (C2, 41, 'Table 2.6: margin positions on short sales at prices of 50, 30 and 70', 'When the shorted stock rises to $70, account equity collapses and a margin call follows.'),
    # Chapter 3
    'l3_info': (C3, 7, 'Descriptive information versus analytical information', 'Descriptive information reports the past; analytical information adds projections and recommendations.'),
    'l3_five': (C3, 19, 'Five key questions to protect yourself', 'Five defensive questions: licensed seller, registered investment, risk versus reward, understanding, recourse.'),
    'l3_djia': (C3, 25, 'Figure 3.5: DJIA compared with the S&P 500, May 2010 to May 2012', 'Two broad indexes move together but not identically: different stocks, different weights.'),
    'l3_orders': (C3, 35, 'Limit, fill-or-kill, day and good-til-canceled orders', 'Every order has a price condition and a time condition.'),
    'l3_stops': (C3, 36, 'Stop-loss and stop-limit orders', 'A stop becomes a market order once triggered; a stop-limit becomes a limit order and may not fill.'),
    'l3_sipc': (C3, 39, 'Trading considerations: transaction costs and SIPC', 'SIPC protects against broker failure, not against churning, bad advice or market losses.'),
    # Appendix 4A
    'l4_keys': (C4A, 4, 'Figure 4A.1: financial calculator keys N, I, PV, PMT, FV and CPT', 'Five TVM keys: N and I set the time environment; PV, PMT and FV are cash flows.'),
    'l4_fv': (C4A, 6, 'Future value example: 1,000 at 8% for two years equals 1,166.40', 'Future value: $1,000 at 8% compounded annually grows to $1,166.40 in two years.'),
    'l4_annuity': (C4A, 8, 'Future value of an annuity: 1,000 a year for 8 years at 8% equals 10,636.63', 'An ordinary annuity of $1,000 a year for 8 years at 8% grows to $10,636.63.'),
    'l4_pv': (C4A, 10, 'Present value example: 1,000 in 7 years at 8% is worth 583.49 today', 'Present value: $1,000 received in 7 years is worth $583.49 today at 8%.'),
    'l4_mixed': (C4A, 13, 'Table 4A.5: mixed-stream present value calculation at 8%', 'A mixed stream has no shortcut: discount each cash flow separately, then add.'),
    'l4_true': (C4A, 20, 'Table 4A.3: true rate of interest for various compounding frequencies at a 5% stated rate', 'More frequent compounding raises the true rate, but by ever smaller amounts.'),
    # Chapter 4
    'l4_required': (C4, 10, 'Required return equals real rate plus expected inflation premium plus risk premium', 'Required return = real rate + inflation premium + risk premium = risk-free rate + risk premium.'),
    'l4_hpr': (C4, 15, 'Holding period return formula', 'HPR = (income + capital gain or loss) / beginning investment value.'),
    'l4_hpr_table': (C4, 16, 'Table 4.6: key financial variables and HPR for four investments', 'HPR puts a savings account, stock, bond and real estate on the same percentage footing.'),
    'l4_irr': (C4, 18, 'Yield (IRR) example: 1,000 growing to 1,400 in five years gives 6.96%', 'A 40% total gain over five years is only a 6.96% compound annual yield.'),
    'l4_interest': (C4, 24, 'Figure 4.1: earning interest on interest at 5% and 8%', 'Over long horizons much of the wealth comes from interest earned on interest.'),
    'l4_spectrum': (C4, 40, 'Figure 4.2: risk-return tradeoffs for various investments', 'Expected return rises with risk, from government securities to options and futures.'),
    'l4_prefs': (C4, 42, 'Figure 4.3: risk preferences, risk-averse, risk-indifferent and risk-seeking', 'Risk-averse lines slope up, risk-indifferent lines are flat, risk-seeking lines slope down.'),
    'l4_steps': (C4, 43, 'Steps in the decision process: combining return and risk', 'Estimate return, assess risk, check the return is reasonable for the risk, then select.'),
    'l4_target': (C4, 51, 'Table 4.8: historical returns for Target and American Eagle Outfitters', 'American Eagle averaged far more than Target, with far more volatile returns.'),
    # Chapter 5
    'l5_return': (C5, 7, 'Portfolio return as the weighted average of asset returns', 'Portfolio return is simply the weighted average of the individual asset returns.'),
    'l5_corr': (C5, 10, 'Figure 5.1: perfectly positively and perfectly negatively correlated series', 'Positively correlated series move together; negatively correlated series move opposite.'),
    'l5_combine': (C5, 12, 'Figure 5.2: combining negatively correlated assets F and G', 'Combining negatively correlated assets F and G smooths the portfolio\'s return.'),
    'l5_ibm': (C5, 13, 'Figure 5.3: portfolios of IBM and Celgene', 'Adding some Celgene to IBM first lowers portfolio risk before raising it.'),
    'l5_combos': (C5, 14, 'Figure 5.4: risk and return for two-asset combinations at correlations of +1, 0 and -1', 'The lower the correlation, the further left the combinations bend: less risk for the same return.'),
    'l5_components': (C5, 18, 'Components of risk: diversifiable and nondiversifiable', 'Diversifiable risk is firm-specific; nondiversifiable risk comes from forces that hit all investments.'),
    'l5_betas': (C5, 21, 'Table 5.4: selected betas and their interpretations', 'Beta 2.0 moves twice as much as the market; negative betas move opposite to it.'),
    'l5_sml': (C5, 27, 'Figure 5.6: the Security Market Line with risk-free rate 6% and market return 10%', 'The SML plots required return against beta: intercept = risk-free rate, slope = market risk premium.'),
    'l5_frontier': (C5, 32, 'Figure 5.7: the feasible set and the efficient frontier with utility curves', 'Only portfolios on the efficient frontier are worth holding; utility curves pick the investor\'s point.'),
    'l5_divers': (C5, 34, 'Figure 5.8: portfolio risk and diversification', 'Adding securities removes diversifiable risk; undiversifiable risk remains.'),
    'l5_austin': (C5, 35, 'Table 5.6: Austin Fund portfolios V and W with proportions and betas', 'Portfolio beta is the weighted average of the asset betas: V = 1.195, W = 0.910.'),
    'l5_policy': (C5, 38, 'Reconciling the traditional approach and MPT', 'The recommended policy blends traditional diversification with MPT\'s correlations and beta.'),
    'l5_xyz': (C5, 45, 'Table 5.3: expected returns for assets X, Y and Z and portfolios XY and XZ', 'XY has zero standard deviation; XZ has 4.2% for the same 13.3% expected return.'),
}


def trim(im, pad=28, tol=12):
    """Crop the empty margin around a slide's content."""
    bg = Image.new('RGB', im.size, im.getpixel((2, 2)))
    box = ImageChops.difference(im, bg).point(lambda v: 255 if v > tol else 0).getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def footer_top(im):
    """Row where the slide template's green copyright bar starts (the image height if there is none)."""
    def green(y):
        xs = range(im.width // 10, im.width * 9 // 10, max(1, im.width // 40))
        hits = sum(1 for x in xs if (lambda p: p[1] > p[0] + 30 and p[1] > p[2] + 40)(im.getpixel((x, y))))
        return hits >= len(xs) * 0.6
    for y in range(int(im.height * 0.8), im.height):
        if green(y):
            return y
    return im.height


def render(key, pdf, page, width=1300, quality=72):
    out = os.path.join(OUT_DIR, key + '.webp')
    if os.path.exists(out):
        return out
    doc = pymupdf.open(os.path.join(PDF_DIR, pdf))
    pg = doc[page - 1]
    zoom = width / pg.rect.width
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
    im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    im = im.crop((0, 0, im.width, footer_top(im)))
    im = trim(im)
    im.save(out, 'WEBP', quality=quality, method=6)
    return out


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    total = 0
    for k, (pdf, page, _, _) in FIGURES.items():
        total += os.path.getsize(render(k, pdf, page))
    print(len(FIGURES), 'figures,', round(total / 1024), 'KB')
