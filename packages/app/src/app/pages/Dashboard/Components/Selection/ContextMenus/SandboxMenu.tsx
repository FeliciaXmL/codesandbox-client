import React from 'react';
import { useOvermind } from 'app/overmind';
import { useHistory, useLocation } from 'react-router-dom';
import { Menu, Tooltip } from '@codesandbox/components';
import getTemplate, { TemplateType } from '@codesandbox/common/lib/templates';

import {
  sandboxUrl,
  dashboard,
} from '@codesandbox/common/lib/utils/url-generator';
import { Context, MenuItem } from '../ContextMenu';
import { DashboardSandbox, DashboardTemplate } from '../../../types';

interface SandboxMenuProps {
  item: DashboardSandbox | DashboardTemplate;
  setRenaming: (value: boolean) => void;
}
export const SandboxMenu: React.FC<SandboxMenuProps> = ({
  item,
  setRenaming,
}) => {
  const {
    state: { user, activeTeam, activeTeamInfo, activeWorkspaceAuthorization },
    effects,
    actions,
  } = useOvermind();
  const { sandbox, type } = item;
  const isTemplate = type === 'template';

  const { visible, setVisibility, position } = React.useContext(Context);

  const history = useHistory();
  const location = useLocation();

  const url = sandboxUrl({
    id: sandbox.id,
    alias: sandbox.alias,
  });

  const folderUrl = getFolderUrl(item, activeTeam);

  const label = isTemplate ? 'Template' : 'Sandbox';
  const isPro = user && Boolean(user.subscription);
  const isTeamPro = activeTeamInfo?.joinedPilotAt;

  // TODO(@CompuIves): remove the `item.sandbox.teamId === null` check, once the server is not
  // responding with teamId == null for personal templates anymore.
  const hasAccess = React.useMemo(() => {
    if (item.sandbox.teamId === activeTeam) {
      return true;
    }

    if (item.sandbox.teamId === null) {
      if (!item.sandbox.authorId) {
        return false;
      }

      return true;
    }

    return false;
  }, [item, activeTeam]);

  const isOwner = React.useMemo(() => {
    if (item.type !== 'template') {
      return item.sandbox.teamId === activeTeam || item.sandbox.teamId === null;
    }

    return (
      item.sandbox.author && item.sandbox.author.username === user.username
    );
  }, [item, user, activeTeam]);

  if (location.pathname.includes('deleted')) {
    if (activeWorkspaceAuthorization === 'READ') return null;

    return (
      <Menu.ContextMenu
        visible={visible}
        setVisibility={setVisibility}
        position={position}
        style={{ width: 200 }}
      >
        <MenuItem
          onSelect={() => {
            actions.dashboard.recoverSandboxes([sandbox.id]);
          }}
        >
          Recover Sandbox
        </MenuItem>
        <MenuItem
          onSelect={() => {
            actions.dashboard.permanentlyDeleteSandboxes([sandbox.id]);
            setVisibility(false);
          }}
        >
          Delete Permanently
        </MenuItem>
      </Menu.ContextMenu>
    );
  }

  const preventSandboxExport =
    activeWorkspaceAuthorization === 'READ' ||
    sandbox.permissions.preventSandboxExport;

  // TODO(@CompuIves): refactor this to an array

  return (
    <Menu.ContextMenu
      visible={visible}
      setVisibility={setVisibility}
      position={position}
      style={{ width: 200 }}
    >
      {isTemplate && activeWorkspaceAuthorization !== 'READ' ? (
        <MenuItem
          onSelect={() => {
            actions.editor.forkExternalSandbox({
              sandboxId: sandbox.id,
              openInNewWindow: true,
            });
          }}
        >
          Fork Template
        </MenuItem>
      ) : null}
      <MenuItem onSelect={() => history.push(url)}>Open {label}</MenuItem>
      <MenuItem
        onSelect={() => {
          window.open(`https://codesandbox.io${url}`, '_blank');
        }}
      >
        Open {label} in New Tab
      </MenuItem>
      <MenuItem
        onSelect={() => {
          effects.browser.copyToClipboard(`https://codesandbox.io${url}`);
        }}
      >
        Copy {label} Link
      </MenuItem>
      {isOwner && folderUrl !== location.pathname ? (
        <MenuItem
          onSelect={() => {
            history.push(folderUrl, { sandboxId: sandbox.id });
          }}
        >
          Show in Folder
        </MenuItem>
      ) : null}

      <Menu.Divider />

      {!isTemplate && activeWorkspaceAuthorization !== 'READ' ? (
        <MenuItem
          onSelect={() => {
            actions.editor.forkExternalSandbox({
              sandboxId: sandbox.id,
              openInNewWindow: true,
            });
          }}
        >
          Fork Sandbox
        </MenuItem>
      ) : null}
      {isOwner && activeWorkspaceAuthorization !== 'READ' ? (
        <MenuItem
          onSelect={() => {
            actions.modals.moveSandboxModal.open({
              sandboxIds: [item.sandbox.id],
              preventSandboxLeaving:
                item.sandbox.permissions.preventSandboxLeaving,
            });
          }}
        >
          Move to Folder
        </MenuItem>
      ) : null}

      <Tooltip
        label={
          preventSandboxExport
            ? 'You do not have permission to export this sandbox'
            : null
        }
      >
        <div>
          <MenuItem
            data-disabled={preventSandboxExport ? true : null}
            onSelect={() => {
              if (preventSandboxExport) return;
              actions.dashboard.downloadSandboxes([sandbox.id]);
            }}
          >
            Export {label}
          </MenuItem>
        </div>
      </Tooltip>

      {hasAccess && activeWorkspaceAuthorization !== 'READ' && isPro ? (
        <>
          <Menu.Divider />
          {sandbox.privacy !== 0 && (
            <MenuItem
              onSelect={() =>
                actions.dashboard.changeSandboxesPrivacy({
                  sandboxIds: [sandbox.id],
                  privacy: 0,
                })
              }
            >
              Make {label} Public
            </MenuItem>
          )}
          {sandbox.privacy !== 1 && (
            <MenuItem
              onSelect={() =>
                actions.dashboard.changeSandboxesPrivacy({
                  sandboxIds: [sandbox.id],
                  privacy: 1,
                })
              }
            >
              Make {label} Unlisted
            </MenuItem>
          )}
          {sandbox.privacy !== 2 && (
            <MenuItem
              onSelect={() =>
                actions.dashboard.changeSandboxesPrivacy({
                  sandboxIds: [sandbox.id],
                  privacy: 2,
                })
              }
            >
              Make {label} Private
            </MenuItem>
          )}
        </>
      ) : null}
      {hasAccess && activeWorkspaceAuthorization !== 'READ' && (
        <>
          <Menu.Divider />
          <MenuItem onSelect={() => setRenaming(true)}>Rename {label}</MenuItem>
        </>
      )}
      {hasAccess &&
        activeWorkspaceAuthorization !== 'READ' &&
        !isTemplate &&
        (sandbox.isFrozen ? (
          <MenuItem
            onSelect={() => {
              actions.dashboard.changeSandboxesFrozen({
                sandboxIds: [sandbox.id],
                isFrozen: false,
              });
            }}
          >
            Unfreeze {label}
          </MenuItem>
        ) : (
          <MenuItem
            onSelect={() => {
              actions.dashboard.changeSandboxesFrozen({
                sandboxIds: [sandbox.id],
                isFrozen: true,
              });
            }}
          >
            Freeze {label}
          </MenuItem>
        ))}
      {hasAccess &&
        activeTeamInfo?.joinedPilotAt &&
        activeWorkspaceAuthorization !== 'READ' &&
        getTemplate(sandbox.source.template as TemplateType).isServer &&
        (sandbox.alwaysOn ? (
          <MenuItem
            onSelect={() => {
              actions.dashboard.changeSandboxAlwaysOn({
                sandboxId: sandbox.id,
                alwaysOn: false,
              });
            }}
          >
            Disable {'"Always-on"'}
          </MenuItem>
        ) : (
          <MenuItem
            onSelect={() => {
              actions.dashboard.changeSandboxAlwaysOn({
                sandboxId: sandbox.id,
                alwaysOn: true,
              });
            }}
          >
            Enable {'"Always-on"'}
          </MenuItem>
        ))}
      {hasAccess &&
        (isTemplate ? (
          <MenuItem
            onSelect={() => {
              actions.dashboard.unmakeTemplates({
                templateIds: [sandbox.id],
              });
            }}
          >
            Convert to Sandbox
          </MenuItem>
        ) : (
          <MenuItem
            onSelect={() => {
              actions.dashboard.makeTemplates({
                sandboxIds: [sandbox.id],
              });
            }}
          >
            Make Sandbox a Template
          </MenuItem>
        ))}
      {hasAccess &&
        isTeamPro &&
        activeWorkspaceAuthorization === 'ADMIN' &&
        (sandbox.permissions.preventSandboxLeaving ? (
          <MenuItem
            onSelect={() => {
              actions.dashboard.setPreventSandboxesLeavingWorkspace({
                sandboxIds: [sandbox.id],
                preventSandboxLeaving: false,
              });
            }}
          >
            Allow Leaving Workspace
          </MenuItem>
        ) : (
          <MenuItem
            onSelect={() => {
              actions.dashboard.setPreventSandboxesLeavingWorkspace({
                sandboxIds: [sandbox.id],
                preventSandboxLeaving: true,
              });
            }}
          >
            Prevent Leaving Workspace
          </MenuItem>
        ))}

      {hasAccess &&
        isTeamPro &&
        activeWorkspaceAuthorization === 'ADMIN' &&
        (sandbox.permissions.preventSandboxExport ? (
          <MenuItem
            onSelect={() => {
              actions.dashboard.setPreventSandboxesExport({
                sandboxIds: [sandbox.id],
                preventSandboxExport: false,
              });
            }}
          >
            Allow Export as .zip
          </MenuItem>
        ) : (
          <MenuItem
            onSelect={() => {
              actions.dashboard.setPreventSandboxesExport({
                sandboxIds: [sandbox.id],
                preventSandboxExport: true,
              });
            }}
          >
            Prevent Export as .zip
          </MenuItem>
        ))}
      {hasAccess && activeWorkspaceAuthorization !== 'READ' && (
        <>
          <Menu.Divider />
          {isTemplate ? (
            <MenuItem
              onSelect={() => {
                const template = item as DashboardTemplate;
                actions.dashboard.deleteTemplate({
                  sandboxId: template.sandbox.id,
                  templateId: template.template.id,
                });
                setVisibility(false);
              }}
            >
              Delete Template
            </MenuItem>
          ) : (
            <MenuItem
              onSelect={() => {
                actions.dashboard.deleteSandbox({
                  ids: [sandbox.id],
                });
                setVisibility(false);
              }}
            >
              Delete Sandbox
            </MenuItem>
          )}
        </>
      )}
    </Menu.ContextMenu>
  );
};

const getFolderUrl = (
  item: DashboardSandbox | DashboardTemplate,
  activeTeamId: string | null
) => {
  if (item.type === 'template') return dashboard.templates(activeTeamId);

  const path = item.sandbox.collection?.path;
  if (path == null || (!item.sandbox.teamId && path === '/')) {
    return dashboard.drafts(activeTeamId);
  }

  return dashboard.allSandboxes(path || '/', activeTeamId);
};
