import './styles.css'

/**
 * A placeholder while the real routes are built. Deliberately reads nothing: public
 * pages are statically generated and never touch the database at request time (ADR-0001).
 */
export default function HomePage() {
  return (
    <div className="placeholder">
      <h1>ThuisBakery</h1>
      <p>Still in the oven.</p>
    </div>
  )
}
