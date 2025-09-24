import { ForumUtils } from '../utils/forumUtils';

describe('ForumUtils - Sistema de Reputación y Badges', () => {
  describe('calculateReputation', () => {
    test('debe calcular reputación correctamente', () => {
      const userStats = {
        threadsCreated: 2,
        commentsCreated: 5,
        likesReceived: 10,
        dislikesReceived: 2,
        threadViews: 100,
        commentViews: 50,
        helpfulComments: 3,
        firstThread: true
      };

      const reputation = ForumUtils.calculateReputation(userStats);

      // Cálculo esperado:
      // (2 * 5) + (5 * 2) + (10 * 1) + (2 * -1) + (100 * 0.1) + (50 * 0.05) + 10 + (3 * 3)
      // = 10 + 10 + 10 - 2 + 10 + 2.5 + 10 + 9 = 59.5 -> redondeado a 60
      expect(reputation).toBe(60);
    });

    test('debe manejar estadísticas vacías', () => {
      expect(ForumUtils.calculateReputation(null)).toBe(0);
      expect(ForumUtils.calculateReputation({})).toBe(0);
    });

    test('no debe permitir reputación negativa', () => {
      const userStats = {
        dislikesReceived: 100 // Muchos dislikes
      };

      expect(ForumUtils.calculateReputation(userStats)).toBe(0);
    });
  });

  describe('getUserBadges', () => {
    test('debe otorgar badges por reputación', () => {
      const userStats = { threadsCreated: 10, commentsCreated: 20 }; // Reputación alta
      const badges = ForumUtils.getUserBadges(userStats);

      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some(badge => badge.key === 'contributor')).toBe(true);
    });

    test('debe otorgar badge especial por primer hilo', () => {
      const userStats = { firstThread: true };
      const badges = ForumUtils.getUserBadges(userStats);

      expect(badges.some(badge => badge.key === 'firstThread')).toBe(true);
    });

    test('debe otorgar badge de moderador', () => {
      const userStats = { isModerator: true };
      const badges = ForumUtils.getUserBadges(userStats);

      expect(badges.some(badge => badge.key === 'moderator')).toBe(true);
    });
  });

  describe('getPrimaryBadge', () => {
    test('debe retornar el badge de mayor nivel', () => {
      const userStats = { threadsCreated: 50, commentsCreated: 100 }; // Alta reputación
      const primaryBadge = ForumUtils.getPrimaryBadge(userStats);

      expect(primaryBadge).toBeDefined();
      expect(primaryBadge.minPoints).toBeDefined();
    });

    test('debe priorizar badges especiales', () => {
      const userStats = {
        threadsCreated: 50,
        isModerator: true
      };

      const primaryBadge = ForumUtils.getPrimaryBadge(userStats);
      expect(primaryBadge.key).toBe('moderator');
    });
  });

  describe('getNextBadge', () => {
    test('debe retornar el siguiente badge desbloqueable', () => {
      const userStats = { threadsCreated: 1, commentsCreated: 1 }; // Baja reputación
      const nextBadge = ForumUtils.getNextBadge(userStats);

      expect(nextBadge).toBeDefined();
      expect(nextBadge.minPoints).toBeGreaterThan(ForumUtils.calculateReputation(userStats));
    });

    test('debe retornar null si ya tiene todos los badges', () => {
      const userStats = { threadsCreated: 1000, commentsCreated: 1000 }; // Muy alta reputación
      const nextBadge = ForumUtils.getNextBadge(userStats);

      expect(nextBadge).toBeNull();
    });
  });

  describe('updateUserStats', () => {
    test('debe actualizar estadísticas correctamente', () => {
      const initialStats = { threadsCreated: 0 };
      const newStats = ForumUtils.updateUserStats(initialStats, 'CREATE_THREAD');

      expect(newStats.threadsCreated).toBe(1);
      // Incluye puntos por hilo (5) + bonus por primer hilo (10) = 15
      expect(newStats.reputation).toBe(ForumUtils.ACTION_POINTS.CREATE_THREAD + ForumUtils.ACTION_POINTS.FIRST_THREAD);
    });

    test('debe marcar primer hilo correctamente', () => {
      const initialStats = { threadsCreated: 0 };
      const newStats = ForumUtils.updateUserStats(initialStats, 'CREATE_THREAD');

      expect(newStats.firstThread).toBe(true);
    });

    test('no debe marcar primer hilo si ya tiene hilos', () => {
      const initialStats = { threadsCreated: 5, firstThread: false };
      const newStats = ForumUtils.updateUserStats(initialStats, 'CREATE_THREAD');

      expect(newStats.firstThread).toBe(false);
      expect(newStats.threadsCreated).toBe(6);
    });
  });

  describe('ACTION_POINTS', () => {
    test('debe tener valores correctos', () => {
      expect(ForumUtils.ACTION_POINTS.CREATE_THREAD).toBe(5);
      expect(ForumUtils.ACTION_POINTS.CREATE_COMMENT).toBe(2);
      expect(ForumUtils.ACTION_POINTS.RECEIVE_LIKE).toBe(1);
      expect(ForumUtils.ACTION_POINTS.RECEIVE_DISLIKE).toBe(-1);
      expect(ForumUtils.ACTION_POINTS.FIRST_THREAD).toBe(10);
    });
  });

  describe('BADGES', () => {
    test('debe tener estructura correcta', () => {
      const newbieBadge = ForumUtils.BADGES.newbie;
      expect(newbieBadge.name).toBe('forum.badges.newbie');
      expect(newbieBadge.icon).toBe('🌱');
      expect(newbieBadge.minPoints).toBe(0);
      expect(newbieBadge.special).toBeUndefined();
    });

    test('badges especiales deben estar marcados', () => {
      const moderatorBadge = ForumUtils.BADGES.moderator;
      expect(moderatorBadge.special).toBe(true);
    });
  });

  // ============ PRUEBAS DE MODERACIÓN ============

  describe('Moderation System', () => {
    describe('filterProfanity', () => {
      // Mock de bad-words para pruebas consistentes
      let mockFilter;

      beforeEach(() => {
        mockFilter = {
          isProfane: jest.fn(),
          clean: jest.fn(),
          addWords: jest.fn()
        };

        // Mock del require para bad-words
        jest.doMock('bad-words', () => {
          return jest.fn().mockImplementation(() => mockFilter);
        });
      });

      afterEach(() => {
        jest.resetModules();
      });

      test('debe detectar lenguaje ofensivo', () => {
        mockFilter.isProfane.mockReturnValue(true);
        mockFilter.clean.mockReturnValue('This is a ******* test');
        // Mock para que solo detecte una palabra ofensiva
        mockFilter.isProfane.mockImplementation((word) => word.toLowerCase().includes('fucking'));

        const result = ForumUtils.filterProfanity('This is a fucking test');
        expect(result.hasProfanity).toBe(true);
        expect(result.severity).toBe('medium'); // Una palabra = medium
      });

      test('debe censurar contenido ofensivo', () => {
        mockFilter.isProfane.mockReturnValue(true);
        mockFilter.clean.mockReturnValue('**** happens');

        const result = ForumUtils.filterProfanity('Shit happens');
        expect(result.hasProfanity).toBe(true);
        expect(result.censoredText).toBe('**** happens');
      });

      test('debe manejar texto limpio', () => {
        mockFilter.isProfane.mockReturnValue(false);
        mockFilter.clean.mockReturnValue('This is a clean message');

        const result = ForumUtils.filterProfanity('This is a clean message');
        expect(result.hasProfanity).toBe(false);
        expect(result.badWords).toHaveLength(0);
        expect(result.severity).toBe('low');
      });

      test('debe manejar errores gracefully', () => {
        // Simular error en bad-words usando mock
        mockFilter.isProfane.mockImplementation(() => {
          throw new Error('Filter error');
        });

        const result = ForumUtils.filterProfanity('Test message');
        expect(result.hasProfanity).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('canModerate', () => {
      test('debe permitir moderación a administradores', () => {
        const admin = { role: 'admin' };
        const result = ForumUtils.canModerate(admin);
        expect(result.canModerate).toBe(true);
      });

      test('debe permitir moderación a moderadores', () => {
        const moderator = { role: 'moderator' };
        const result = ForumUtils.canModerate(moderator);
        expect(result.canModerate).toBe(true);
      });

      test('debe denegar moderación a usuarios normales', () => {
        const user = { role: 'user' };
        const result = ForumUtils.canModerate(user);
        expect(result.canModerate).toBe(false);
        expect(result.reason).toContain('sin permisos');
      });

      test('debe prevenir que moderadores moderen a otros moderadores', () => {
        const moderator = { role: 'moderator' };
        const targetModerator = { role: 'moderator' };
        const result = ForumUtils.canModerate(moderator, targetModerator);
        expect(result.canModerate).toBe(false);
        expect(result.reason).toContain('moderadores');
      });

      test('debe permitir que admins moderen a todos', () => {
        const admin = { role: 'admin' };
        const targetModerator = { role: 'moderator' };
        const result = ForumUtils.canModerate(admin, targetModerator);
        expect(result.canModerate).toBe(true);
      });
    });

    describe('getAutoModerationAction', () => {
      test('debe retornar null para contenido limpio', () => {
        const contentAnalysis = { hasProfanity: false };
        const result = ForumUtils.getAutoModerationAction(contentAnalysis);
        expect(result.action).toBeNull();
      });

      test('debe advertir a usuarios nuevos con ofensivas leves', () => {
        const contentAnalysis = { hasProfanity: true, severity: 'low' };
        const userHistory = { previousViolations: 0, accountAge: 1 }; // 1 día
        const result = ForumUtils.getAutoModerationAction(contentAnalysis, userHistory);
        expect(result.action).toBe(ForumUtils.MODERATION_ACTIONS.WARN);
      });

      test('debe eliminar contenido con alta severidad', () => {
        const contentAnalysis = { hasProfanity: true, severity: 'high' };
        const userHistory = { previousViolations: 1 }; // Usuario con violaciones previas
        const result = ForumUtils.getAutoModerationAction(contentAnalysis, userHistory);
        expect(result.action).toBe(ForumUtils.MODERATION_ACTIONS.DELETE_CONTENT);
      });
    });

    describe('calculateSuspensionDuration', () => {
      test('debe calcular duración basada en violaciones previas', () => {
        const history1 = { previousViolations: 0 };
        const result1 = ForumUtils.calculateSuspensionDuration(history1);
        expect(result1.duration).toBe(1); // 1 día

        const history2 = { previousViolations: 1 };
        const result2 = ForumUtils.calculateSuspensionDuration(history2);
        expect(result2.duration).toBe(3); // 3 días
      });

      test('debe reducir duración si ha pasado tiempo', () => {
        const history = {
          previousViolations: 1,
          lastViolation: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 días atrás
        };
        const result = ForumUtils.calculateSuspensionDuration(history);
        expect(result.duration).toBe(1); // Reducido de 3 a 1
      });
    });

    describe('generateModerationLog', () => {
      test('debe generar log correctamente', () => {
        const data = {
          moderator: { id: 'mod1', username: 'ModUser', role: 'moderator' },
          action: 'delete_content',
          targetType: 'comment',
          targetId: 'comment1',
          reason: 'Contenido ofensivo'
        };

        const log = ForumUtils.generateModerationLog(data);

        expect(log.moderator.id).toBe('mod1');
        expect(log.action).toBe('delete_content');
        expect(log.target.type).toBe('comment');
        expect(log.reason).toBe('Contenido ofensivo');
        expect(log.timestamp).toBeDefined();
      });
    });

    describe('checkUserBlockStatus', () => {
      test('debe retornar no bloqueado para usuarios sin bloqueos', () => {
        const result = ForumUtils.checkUserBlockStatus({ id: 'user1' }, []);
        expect(result.isBlocked).toBe(false);
      });

      test('debe detectar bloqueos permanentes', () => {
        const user = { id: 'user1' };
        const blocks = [{
          userId: 'user1',
          isPermanent: true,
          reason: 'Spam',
          moderator: { username: 'Mod' }
        }];

        const result = ForumUtils.checkUserBlockStatus(user, blocks);
        expect(result.isBlocked).toBe(true);
        expect(result.blockType).toBe('permanent');
      });

      test('debe detectar bloqueos temporales activos', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Mañana
        const user = { id: 'user1' };
        const blocks = [{
          userId: 'user1',
          isPermanent: false,
          expiresAt: futureDate,
          reason: 'Temporal ban',
          moderator: { username: 'Mod' }
        }];

        const result = ForumUtils.checkUserBlockStatus(user, blocks);
        expect(result.isBlocked).toBe(true);
        expect(result.blockType).toBe('temporary');
        expect(result.expiresAt).toBe(futureDate);
      });

      test('debe ignorar bloqueos expirados', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ayer
        const user = { id: 'user1' };
        const blocks = [{
          userId: 'user1',
          isPermanent: false,
          expiresAt: pastDate,
          reason: 'Expired ban'
        }];

        const result = ForumUtils.checkUserBlockStatus(user, blocks);
        expect(result.isBlocked).toBe(false);
      });
    });

    describe('validateReportIntensity', () => {
      test('debe calcular intensidad correctamente', () => {
        const report = { targetType: 'thread', targetId: 't1', reason: 'spam' };
        const existingReports = [
          { targetType: 'thread', targetId: 't1', reason: 'spam' },
          { targetType: 'thread', targetId: 't1', reason: 'spam' }
        ];

        const result = ForumUtils.validateReportIntensity(report, existingReports);
        expect(result.intensity).toBe(3); // 2 existentes + 1 nuevo
        expect(result.priority).toBe('medium');
        expect(result.requiresImmediateAction).toBe(true);
      });

      test('debe asignar prioridad alta para muchos reportes', () => {
        const report = { targetType: 'thread', targetId: 't1', reason: 'spam' };
        const existingReports = Array(4).fill({
          targetType: 'thread', targetId: 't1', reason: 'spam'
        });

        const result = ForumUtils.validateReportIntensity(report, existingReports);
        expect(result.intensity).toBe(5);
        expect(result.priority).toBe('high');
      });
    });

    describe('Constants', () => {
      test('CONTENT_TYPES debe tener valores correctos', () => {
        expect(ForumUtils.CONTENT_TYPES.THREAD).toBe('thread');
        expect(ForumUtils.CONTENT_TYPES.COMMENT).toBe('comment');
        expect(ForumUtils.CONTENT_TYPES.USER).toBe('user');
      });

      test('REPORT_REASONS debe incluir todas las razones', () => {
        expect(ForumUtils.REPORT_REASONS.SPAM).toBe('spam');
        expect(ForumUtils.REPORT_REASONS.HARASSMENT).toBe('harassment');
        expect(ForumUtils.REPORT_REASONS.HATE_SPEECH).toBe('hate_speech');
      });

      test('MODERATION_STATUS debe tener estados válidos', () => {
        expect(ForumUtils.MODERATION_STATUS.PENDING).toBe('pending');
        expect(ForumUtils.MODERATION_STATUS.RESOLVED).toBe('resolved');
        expect(ForumUtils.MODERATION_STATUS.DISMISSED).toBe('dismissed');
      });

      test('MODERATION_ACTIONS debe incluir todas las acciones', () => {
        expect(ForumUtils.MODERATION_ACTIONS.WARN).toBe('warn');
        expect(ForumUtils.MODERATION_ACTIONS.DELETE_CONTENT).toBe('delete_content');
        expect(ForumUtils.MODERATION_ACTIONS.BAN_USER).toBe('ban_user');
      });
    });
  });
});