import {createWorkspace, createWorkspacePlugin} from '@shopify/loom';
import {buildLibraryWorkspace} from '@shopify/loom-plugin-build-library';
import {eslint} from '@shopify/loom-plugin-eslint';
import {prettier} from '@shopify/loom-plugin-prettier';
import {Config} from '@jest/types';

import type {} from '@shopify/loom-plugin-jest';

export default createWorkspace((workspace) => {
  workspace.use(
    buildLibraryWorkspace(),
    eslint(),
    prettier({files: '**/*.{json,md}'}),
    jestWorkspaceConfigPlugin(),
  );
});

function jestWorkspaceConfigPlugin() {
  return createWorkspacePlugin(
    'shopify-app-js--workplace-setup',
    ({tasks: {test}}) => {
      test.hook(({hooks}) => {
        hooks.configure.hook((configure) => {
          configure.jestSetupFilesAfterEnv?.hook((files) => [
            ...files,
            '../../tests/setup/setup-jest.ts',
          ]);
          configure.jestConfig?.hook((config) => {
            const projects = configureProjects(
              config.projects as Config.InitialProjectOptions[],
            );
            return {...config, projects, testTimeout: 30000};
          });
        });
      });
    },
  );
}

function configureProjects(projects: Config.InitialProjectOptions[]) {
  return projects.reduce((acc, project) => {
    /**
     * The remix project is a bit of a special case because we need to run its tests in two different environments, one
     * using jsdom and the other, node.
     *
     * To achieve that, we create two separate projects which copy all of the settings from the original project, overriding
     * the test environment and making them mutually exclusive.
     */
    if (
      typeof project !== 'string' &&
      project.displayName === 'shopify-app-remix'
    ) {
      return acc.concat(
        [
          {
            ...project,
            displayName: 'shopify-app-remix-react',
            testEnvironment: 'jsdom',
            testPathIgnorePatterns: ['src/server'],
          },
        ],
        [
          {
            ...project,
            displayName: 'shopify-app-remix-server',
            testEnvironment: 'node',
            testPathIgnorePatterns: ['src/react'],
          },
        ],
      );
    }

    /*
     * drizzle-orm is a special case because it seems to be ESM-only, so we need jest to run it through babel for the
     * tests to work.
     */

    if (
      typeof project !== 'string' &&
      project.displayName === 'shopify-app-session-storage-drizzle'
    ) {
      project.transformIgnorePatterns = [
        ...(project.transformIgnorePatterns ?? []),
        'node_modules/(?!drizzle-orm)',
      ];
    }

    return acc.concat(project);
  }, [] as Config.InitialProjectOptions[]);
}
