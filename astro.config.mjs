// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// GitHub Pages deployment configuration
	// This site is deployed to https://kannan-chandra.github.io/puzzle-games/
	// The base path must match the repository name
	// To deploy to a different repo, change 'puzzle-games' to the new repo name
	site: 'https://kannan-chandra.github.io',
	base: '/puzzle-games/',
});
