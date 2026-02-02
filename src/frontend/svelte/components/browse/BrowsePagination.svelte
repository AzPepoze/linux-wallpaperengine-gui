<script lang="ts">
     import Button from "../ui/Button.svelte";

     export let currentPage: number = 0;
     export let totalItems: number = 0;
     export let itemsPerPage: number = 50;
     export let hasMore: boolean = false;
     export let isLoading: boolean = false;
     export let onPageChange: (page: number) => void;

     const maxPages = Math.ceil((totalItems || 1) / itemsPerPage);

     function handlePrevClick() {
          if (currentPage > 0) {
               const newPage = currentPage - 1;
               onPageChange(newPage);
          }
     }

     function handleNextClick() {
          if (hasMore) {
               const newPage = currentPage + 1;
               onPageChange(newPage);
          }
     }

     function handlePageInputChange(e: Event) {
          const target = e.target as HTMLInputElement;
          const pageNum = Math.max(0, parseInt(target.value) - 1);
          onPageChange(pageNum);
     }
</script>

<div class="pagination-controls">
     <Button
          variant="secondary"
          on:click={handlePrevClick}
          disabled={currentPage === 0 || isLoading}
     >
          ← Prev
     </Button>
     <input
          type="number"
          class="page-input"
          value={currentPage + 1}
          min="1"
          on:change={handlePageInputChange}
          disabled={isLoading}
     />
     <span class="page-label">/ {maxPages}</span>
     <Button
          variant="secondary"
          on:click={handleNextClick}
          disabled={isLoading || !hasMore}
     >
          Next →
     </Button>
</div>

<style lang="scss">
     .pagination-controls {
          position: sticky;
          bottom: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          box-sizing: border-box;
          z-index: 10;
          border-radius: 20px;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
          margin-inline: 5px;

          .page-input {
               width: 60px;
               padding: 8px 10px;
               font-size: 1em;
               font-weight: 600;
               color: var(--text-color);
               background: var(--bg-color);
               border: 1px solid var(--border-color);
               border-radius: var(--radius-md);
               text-align: center;
               cursor: pointer;
               transition: all 0.2s ease;

               &:hover:not(:disabled) {
                    background: var(--bg-color);
                    border-color: var(--btn-primary-bg);
                    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
               }

               &:focus {
                    outline: none;
                    background: var(--bg-color);
                    border-color: var(--btn-primary-bg);
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
               }

               &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
               }
          }

          .page-label {
               font-size: 0.95em;
               color: var(--text-muted);
               min-width: 40px;
          }

          :global(.btn) {
               padding: 8px 16px !important;
               font-size: 0.9em !important;

               &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
               }
          }
     }
</style>
