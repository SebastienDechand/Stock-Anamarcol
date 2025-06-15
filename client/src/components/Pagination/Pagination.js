import "./Pagination.css";

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className="pagination">
        <li style={{ display: currentPage === 1 ? "none" : "block" }}>
          <button
            onClick={() => paginate(currentPage - 1)}
            className="button"
            aria-label="Page précédente"
          >
            &lt;
          </button>
        </li>

        {pageNumbers.length > 3 && currentPage > 3 ? (
          <>
            <li>
              <button onClick={() => paginate(1)} aria-label="Première page">
                1
              </button>
            </li>
            <li>...</li>
          </>
        ) : (
          <li
            style={{
              display:
                currentPage === 1 || currentPage === 2 ? "none" : "block",
            }}
          >
            <button onClick={() => paginate(1)} aria-label="Première page">
              1
            </button>
          </li>
        )}

        {pageNumbers.map(
          (number) =>
            number >= currentPage - 1 &&
            number <= currentPage + 1 && (
              <li
                key={number}
                className={currentPage === number ? "active" : ""}
              >
                <button
                  onClick={() => paginate(number)}
                  aria-label="Numéro de la page"
                >
                  {number}
                </button>
              </li>
            )
        )}

        {pageNumbers.length > 3 && currentPage < pageNumbers.length - 2 ? (
          <>
            <li>...</li>
            <li>
              <button
                onClick={() => paginate(pageNumbers.length)}
                aria-label="Dernière page"
              >
                {pageNumbers.length}
              </button>
            </li>
          </>
        ) : (
          <li
            style={{
              display:
                currentPage === pageNumbers.length ||
                currentPage === pageNumbers.length - 1
                  ? "none"
                  : "block",
            }}
          >
            <button
              onClick={() => paginate(pageNumbers.length)}
              aria-label="Dernière page"
            >
              {pageNumbers.length}
            </button>
          </li>
        )}

        <li
          style={{
            display: currentPage === pageNumbers.length ? "none" : "block",
          }}
        >
          <button
            onClick={() => paginate(currentPage + 1)}
            className="button"
            aria-label="Page suivante"
          >
            &gt;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
