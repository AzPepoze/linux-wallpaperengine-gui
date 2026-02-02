<script lang="ts">
     import ActionToggle from "../ActionToggle.svelte";
     import FilterItem from "./FilterItem.svelte";
     import Collapse from "./Collapse.svelte";
     import ResizeHandle from "../ui/ResizeHandle.svelte";

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
     let sidebarWidth = 280;

     function handleToggleFilter(category: string, filter: string) {
          onToggleFilter(category, filter);
     }

     function isFilterActive(category: string, filter: string): boolean {
          return selectedFilters.get(category)?.has(filter) || false;
     }

     function handleResize(newWidth: number) {
          sidebarWidth = newWidth;
     }
</script>

<div class="filter-sidebar" style="width: {sidebarWidth}px;">
     <div class="sidebar-header">
          <h2>Filters</h2>
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

     <ResizeHandle bind:width={sidebarWidth} onResize={handleResize} />
</div>

<style lang="scss">
     .filter-sidebar {
          background: rgba(20, 20, 20, 0.6);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;

          .sidebar-header {
               border-bottom: 1px solid var(--border-color);
               font-weight: 800;
          }

          .filter-content {
               flex: 1;
               overflow-y: auto;
               padding: 20px 20px;

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
