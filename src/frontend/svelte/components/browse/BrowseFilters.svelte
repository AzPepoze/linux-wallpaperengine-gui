<script lang="ts">
     import ActionToggle from "../ActionToggle.svelte";
     import FilterItem from "./FilterItem.svelte";

     export let genres: string[] = [];
     export let tags: string[] = [];
     export let selectedGenres: Set<string>;
     export let selectedTags: Set<string>;
     export let onToggleGenre: (genre: string) => void;
     export let onToggleTag: (tag: string) => void;
     export let onLoadItems: () => void;
     export let onOpenInBrowser: () => void;
     export let isLoading: boolean = false;

     function handleToggleTag(tag: string) {
          onToggleTag(tag);
     }

     function handleToggleGenre(genre: string) {
          onToggleGenre(genre);
     }
</script>

<div class="filter-sidebar">
     <div class="sidebar-header">
          <h2>Filters</h2>
          <p>Refine your search</p>
     </div>

     <div class="filter-content">
          <div class="filter-group">
               <h4>Genres</h4>
               <div class="filter-list">
                    {#each genres as genre}
                         <FilterItem
                              label={genre}
                              isActive={selectedGenres.has(genre)}
                              onClick={() => handleToggleGenre(genre)}
                         />
                    {/each}
               </div>
          </div>

          <div class="filter-group">
               <h4>Tags</h4>
               <div class="filter-list">
                    {#each tags as tag}
                         <FilterItem
                              label={tag}
                              isActive={selectedTags.has(tag)}
                              onClick={() => handleToggleTag(tag)}
                         />
                    {/each}
               </div>
          </div>
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
               }
          }

          .filter-group {
               margin-bottom: 32px;

               h4 {
                    margin: 0 0 12px;
                    font-size: 0.8em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                    color: var(--text-muted);
                    opacity: 0.8;
               }

               .filter-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
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
