<script lang="ts">
     import ActionToggle from "../ActionToggle.svelte";
     import FilterItem from "./FilterItem.svelte";
     import Collapse from "./Collapse.svelte";

     interface FilterCategory {
          name: string;
          items: string[];
     }

     export let filterCategories: FilterCategory[] = [];
     export let selectedFilters: Map<string, Set<string>> = new Map();
     export let onToggleFilter: (category: string, filter: string) => void;
     export let onLoadItems: () => void;
     export let onOpenInBrowser: () => void;
     export let isLoading: boolean = false;

     let expandedCategories: Record<string, boolean> = {};

     function handleToggleFilter(category: string, filter: string) {
          onToggleFilter(category, filter);
     }

     function isFilterActive(category: string, filter: string): boolean {
          return selectedFilters.get(category)?.has(filter) || false;
     }
</script>

<div class="filter-sidebar">
     <div class="sidebar-header">
          <h2>Filters</h2>
          <p>Refine your search</p>
     </div>

     <div class="filter-content">
          {#each filterCategories as category (category.name)}
               <Collapse
                    title={category.name}
                    bind:isExpanded={expandedCategories[category.name]}
               >
                    <div class="filter-list">
                         {#each category.items as item (item)}
                              <FilterItem
                                   label={item}
                                   isActive={isFilterActive(
                                        category.name,
                                        item,
                                   )}
                                   onClick={() =>
                                        handleToggleFilter(category.name, item)}
                              />
                         {/each}
                    </div>
               </Collapse>
          {/each}
     </div>

     <div class="sidebar-footer">
          <ActionToggle {isLoading} {onLoadItems} {onOpenInBrowser} />
     </div>
</div>

<style lang="scss">
     .filter-sidebar {
          width: 280px;
          background: rgba(20, 20, 20, 0.6);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 32px 0;

          .sidebar-header {
               padding: 0 20px 24px;
               border-bottom: 1px solid var(--border-color);
               margin-bottom: 20px;

               h2 {
                    margin: 0;
                    font-size: 1.5em;
                    font-weight: 800;
                    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
               }

               p {
                    margin: 4px 0 0;
                    font-size: 0.85em;
                    color: var(--text-muted);
               }
          }

          .filter-content {
               flex: 1;
               overflow-y: auto;
               padding: 0 20px;

               &::-webkit-scrollbar {
                    width: 6px;
               }
               &::-webkit-scrollbar-track {
                    background: transparent;
               }
               &::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 3px;

                    &:hover {
                         background: var(--text-muted);
                    }
               }

               :global(.collapse-container) {
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding-bottom: 12px;

                    &:last-child {
                         border-bottom: none;
                    }
               }

               .filter-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
               }
          }

          .sidebar-footer {
               padding: 20px;
               border-top: 1px solid var(--border-color);
               background: rgba(0, 0, 0, 0.2);
               margin-top: auto;
          }
     }
</style>
