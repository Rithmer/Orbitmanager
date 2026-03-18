import { UsersPrismaRepository } from './users.prisma.repository';
import { TeamsPrismaRepository } from './teams.prisma.repository';
import { ProjectsPrismaRepository } from './projects.prisma.repository';
import { TasksPrismaRepository } from './tasks.prisma.repository';
import { TeamMembersPrismaRepository } from './team-members.prisma.repository';
import { ProjectMembersPrismaRepository } from './project-members.prisma.repository';

type DeleteMock = jest.Mock<Promise<void>, [{ where: { id: number } }]>;

function createDeleteCase<T>(
  RepositoryClass: new (prisma: any) => T,
  prismaKey: string,
) {
  const deleteMock = jest.fn<Promise<void>, [{ where: { id: number } }]>();
  const prisma = {
    [prismaKey]: {
      delete: deleteMock,
    },
  };

  return {
    repository: new RepositoryClass(prisma),
    deleteMock,
  };
}

describe('Prisma repository delete contracts', () => {
  const cases = [
    {
      label: 'UsersPrismaRepository',
      prismaKey: 'user',
      factory: () => createDeleteCase(UsersPrismaRepository, 'user'),
    },
    {
      label: 'TeamsPrismaRepository',
      prismaKey: 'team',
      factory: () => createDeleteCase(TeamsPrismaRepository, 'team'),
    },
    {
      label: 'ProjectsPrismaRepository',
      prismaKey: 'project',
      factory: () => createDeleteCase(ProjectsPrismaRepository, 'project'),
    },
    {
      label: 'TasksPrismaRepository',
      prismaKey: 'task',
      factory: () => createDeleteCase(TasksPrismaRepository, 'task'),
    },
    {
      label: 'TeamMembersPrismaRepository',
      prismaKey: 'teamMember',
      factory: () =>
        createDeleteCase(TeamMembersPrismaRepository, 'teamMember'),
    },
    {
      label: 'ProjectMembersPrismaRepository',
      prismaKey: 'projectMember',
      factory: () =>
        createDeleteCase(ProjectMembersPrismaRepository, 'projectMember'),
    },
  ];

  it.each(cases)('$label returns false only for P2025', async ({ factory }) => {
    const { repository, deleteMock } = factory() as {
      repository: { delete(id: number): Promise<boolean> };
      deleteMock: DeleteMock;
    };

    deleteMock.mockRejectedValueOnce({ code: 'P2025' });

    await expect(repository.delete(1)).resolves.toBe(false);
  });

  it.each(cases)('$label rethrows non-P2025 errors', async ({ factory }) => {
    const { repository, deleteMock } = factory() as {
      repository: { delete(id: number): Promise<boolean> };
      deleteMock: DeleteMock;
    };
    const error = Object.assign(new Error('fk violation'), { code: 'P2003' });

    deleteMock.mockRejectedValueOnce(error);

    await expect(repository.delete(1)).rejects.toThrow('fk violation');
  });
});
