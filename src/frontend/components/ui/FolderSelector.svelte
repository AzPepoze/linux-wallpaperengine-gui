<script lang="ts">
    let { location = $bindable() } = $props();

    async function selectDirectory(_: Event) {
        location = await window.electronAPI.selectDir();
    }
</script>

<style>
    .button {
        margin-left: 5px;
        margin-right: 5px;
        border-radius: 10px;
    }

    .input {
        background-color: transparent;
        color: #fff;
        border: none;
    }
</style>

<div class="form-group">
    <input type="text" class="input" value="{location}" disabled>
    <button class="button" onclick={selectDirectory}>Select</button>
</div>