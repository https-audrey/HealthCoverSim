const money = (n) =>
  n == null ? "-" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExplanationSheet({ breakdown }) {
  if (!breakdown) return null;

  const {
    hospitalCoverLevel,
    extrasCoverLevel,
    applicants,
    hospitalTotal,
    extrasTotal,
    familyFee,
    monthlyPremium,
    yearlyBeforeDiscount,
    paymentFrequency,
    discountPercent,
    yearlyAfterDiscount,
    warnings,
    lhcStatement,
  } = breakdown;

  return (
    <div className="explanation-sheet">
      <h3>Explanation Sheet</h3>

      {warnings.length > 0 && (
        <div className="warning-box">
          {warnings.map((w, i) => (
            <p key={i}>⚠ {w}</p>
          ))}
        </div>
      )}

      <table className="breakdown-table">
        <tbody>
          <tr>
            <th>Hospital cover level</th>
            <td>{hospitalCoverLevel}</td>
          </tr>
          <tr>
            <th>Extras cover level</th>
            <td>{extrasCoverLevel}</td>
          </tr>
          {applicants.map((a) => (
            <tr key={a.label}>
              <th>
                {a.label} (age {a.age}, history: {a.coverHistory})
              </th>
              <td>
                LHC loading: {a.loadingPercent}% → hospital cost {money(a.hospitalCost)}
              </td>
            </tr>
          ))}
          <tr>
            <th>Hospital premium (total)</th>
            <td>{money(hospitalTotal)}</td>
          </tr>
          <tr>
            <th>Extras premium (total)</th>
            <td>{money(extrasTotal)}</td>
          </tr>
          {familyFee > 0 && (
            <tr>
              <th>Family upgrade fee</th>
              <td>{money(familyFee)}</td>
            </tr>
          )}
          <tr className="highlight">
            <th>Monthly premium</th>
            <td>{money(monthlyPremium)}</td>
          </tr>
          <tr>
            <th>Yearly premium (before discount)</th>
            <td>{money(yearlyBeforeDiscount)}</td>
          </tr>
          {paymentFrequency === "Yearly" && (
            <tr className="highlight">
              <th>Yearly premium after {discountPercent}% discount</th>
              <td>{money(yearlyAfterDiscount)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="lhc-statement">{lhcStatement}</p>

      <p className="plain-english">
        This estimate adds the hospital premium (base tier price per adult, increased by
        each applicant's Lifetime Health Cover loading) to the extras premium (base tier
        price × number of adults){familyFee > 0 ? ", plus the flat $30/month family upgrade fee," : ""} to
        get the monthly premium. The yearly premium before discount is simply the monthly
        premium × 12.
        {paymentFrequency === "Yearly"
          ? ` Because this quote is paid yearly, a ${discountPercent}% annual-payment discount is then applied to reach the final yearly total.`
          : " Because this quote is paid monthly, no annual-payment discount applies."}
      </p>
    </div>
  );
}
