require('dotenv').config();
const fs = require('fs');
const path = require('path');
const database = require('./connection');
const logger = require('../utils/logger');

const MAX_INT = 2147483647;
const parseBudget = (budget) => {
  if (typeof budget === 'number') return budget > MAX_INT ? null : budget;
  if (budget && typeof budget === 'string') {
    const parsed = parseInt(budget.replace(/\D/g, ''));
    if (isNaN(parsed) || parsed > MAX_INT) return null;
    return parsed;
  }
  return null;
};

async function manualSeed() {
  try {
    logger.info('Connecting to database...');
    await database.connect();

    // Load sample data
    const sampleDataPath = path.join(__dirname, '../../sampledata');
    const clientsData = JSON.parse(fs.readFileSync(path.join(sampleDataPath, 'sample_clients_database.json'), 'utf8'));
    const talentsData = JSON.parse(fs.readFileSync(path.join(sampleDataPath, 'Talent Profiles.json'), 'utf8'));
    const gigsData = JSON.parse(fs.readFileSync(path.join(sampleDataPath, 'Gigs Dataset.json'), 'utf8'));
    const matchesData = JSON.parse(fs.readFileSync(path.join(sampleDataPath, 'Match History.json'), 'utf8'));

    // Clear existing data
    logger.info('Clearing existing data...');
    const tables = [
      'matches', 'gig_style_tags', 'gigs', 'client_style_preferences', 'clients',
      'talent_availability', 'talent_portfolio', 'talent_style_tags', 'talent_skills',
      'talent_categories', 'talents', 'talent_embeddings', 'gig_embeddings'
    ];
    for (const table of tables) {
      await database.run(`DELETE FROM ${table}`);
    }

    // Seed clients
    logger.info('Seeding clients...');
    let clientCount = 0;
    for (const [i, client] of clientsData.entries()) {
      try {
        await database.run(`
        INSERT INTO clients (
          id, name, type, industry, sub_industry, city, headquarters_city,
          operating_cities, contact_person, designation, communication,
          personality, brand_style, project_behavior, budgeting, client_tier,
          talent_preferences, project_history, inbound_source, important_dates,
          social_profiles, notes_and_history, past_feedback, lead_owner,
          is_repeat_client, attachments_docs_provided
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        ON CONFLICT (id) DO NOTHING
      `, [
        client.id,
        client.name,
        client.type,
        client.industry,
        client.sub_industry,
        client.city,
        client.headquarters_city,
        JSON.stringify(client.operating_cities),
        client.contact_person,
        client.designation,
        JSON.stringify(client.communication),
        JSON.stringify(client.personality),
        JSON.stringify(client.brand_style),
        JSON.stringify(client.project_behavior),
        JSON.stringify(client.budgeting),
        client.client_tier,
        JSON.stringify(client.talent_preferences),
        JSON.stringify(client.project_history),
        client.inbound_source,
        JSON.stringify(client.important_dates),
        JSON.stringify(client.social_profiles),
        client.notes_and_history,
        client.past_feedback,
        client.lead_owner,
        client.is_repeat_client ? 1 : 0,
        client.attachments_docs_provided ?? null
      ]);
        if (client.style_preferences) {
          for (const preference of client.style_preferences) {
            try {
              await database.run(
                'INSERT INTO client_style_preferences (client_id, style_preference) VALUES ($1, $2) ON CONFLICT (client_id, style_preference) DO NOTHING',
                [client.id, preference]
              );
            } catch (err) {
              logger.error(`Failed to insert client_style_preference for client ${client.id}: ${err.message}`);
            }
          }
        }
        clientCount++;
      } catch (err) {
        logger.error(`Failed to insert client ${client.id} (${i + 1}): ${err.message}`);
      }
    }
    logger.info(`Seeded ${clientCount} clients`);

    // Seed talents
    logger.info('Seeding talents...');
    let talentCount = 0;
    for (const [i, talent] of talentsData.entries()) {
      logger.info(`Seeding talent ${i + 1} of ${talentsData.length} (${talent.id})`);
      try {
        await database.run(`
        INSERT INTO talents (
          id, name, city, hometown, experience_years, budget_min, budget_max,
          soft_skills, software_skills, languages, past_credits, endorsements,
          interest_tags, tier_tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING
      `, [
        talent.id,
        talent.name,
        talent.city,
        talent.hometown,
        talent.experience_years,
        (() => {
          const budgetRange = talent.budget_range;
          if (budgetRange && typeof budgetRange === 'string') {
            const match = budgetRange.match(/₹?(\d+)[–-]₹?(\d+)/);
            if (match) {
              const min = parseInt(match[1]);
              return isNaN(min) || min > MAX_INT ? null : min;
            }
          }
          return null;
        })(),
        (() => {
          const budgetRange = talent.budget_range;
          if (budgetRange && typeof budgetRange === 'string') {
            const match = budgetRange.match(/₹?(\d+)[–-]₹?(\d+)/);
            if (match) {
              const max = parseInt(match[2]);
              return isNaN(max) || max > MAX_INT ? null : max;
            }
          }
          return null;
        })(),
        JSON.stringify(talent.soft_skills),
        JSON.stringify(talent.software_skills),
        JSON.stringify(talent.languages),
        JSON.stringify(talent.past_credits),
        JSON.stringify(talent.endorsements),
        JSON.stringify(talent.interest_tags),
        JSON.stringify(talent.tier_tags)
      ]);
        if (talent.categories) {
          for (const category of talent.categories) {
            try {
              await database.run(
                'INSERT INTO talent_categories (talent_id, category) VALUES ($1, $2) ON CONFLICT (talent_id, category) DO NOTHING',
                [talent.id, category]
              );
            } catch (err) {
              logger.error(`Failed to insert talent_category for talent ${talent.id}: ${err.message}`);
            }
          }
        }
        if (talent.skills) {
          for (const skill of talent.skills) {
            try {
              await database.run(
                'INSERT INTO talent_skills (talent_id, skill) VALUES ($1, $2) ON CONFLICT (talent_id, skill) DO NOTHING',
                [talent.id, skill]
              );
            } catch (err) {
              logger.error(`Failed to insert talent_skill for talent ${talent.id}: ${err.message}`);
            }
          }
        }
        if (talent.style_tags) {
          for (const styleTag of talent.style_tags) {
            try {
              await database.run(
                'INSERT INTO talent_style_tags (talent_id, style_tag) VALUES ($1, $2) ON CONFLICT (talent_id, style_tag) DO NOTHING',
                [talent.id, styleTag]
              );
            } catch (err) {
              logger.error(`Failed to insert talent_style_tag for talent ${talent.id}: ${err.message}`);
            }
          }
        }
        if (talent.portfolio) {
          for (const portfolioItem of talent.portfolio) {
            try {
              await database.run(`
            INSERT INTO talent_portfolio (talent_id, title, tags, keywords)
            VALUES ($1, $2, $3, $4)
          `, [
            talent.id,
            portfolioItem.title,
            JSON.stringify(portfolioItem.tags),
            JSON.stringify(portfolioItem.keywords)
          ]);
            } catch (err) {
              logger.error(`Failed to insert talent_portfolio for talent ${talent.id}: ${err.message}`);
            }
          }
        }
        if (talent.availability_calendar) {
          for (const availability of talent.availability_calendar) {
            try {
              await database.run(`
            INSERT INTO talent_availability (talent_id, city, from_date, to_date)
            VALUES ($1, $2, $3, $4)
          `, [
            talent.id,
            availability.city,
            availability.from,
            availability.to
          ]);
            } catch (err) {
              logger.error(`Failed to insert talent_availability for talent ${talent.id}: ${err.message}`);
            }
          }
        }
        talentCount++;
      } catch (err) {
        logger.error(`Failed to insert talent ${talent.id} (${i + 1}): ${err.message}`);
      }
    }
    logger.info(`Seeded ${talentCount} talents`);

    // Seed gigs
    logger.info('Seeding gigs...');
    let gigCount = 0;
    for (const [i, gig] of gigsData.entries()) {
      try {
        await database.run(`
        INSERT INTO gigs (
          id, title, brief_text, category, city, budget, budget_range,
          client_id, style_tags, expectation_level, status, start_date,
          has_docs, docs_type, is_date_fixed, references_given, urgency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        gig.id,
        gig.title,
        gig.brief_text,
        gig.category,
        gig.city,
        parseBudget(gig.budget),
        gig.budget_range,
        gig.client_id,
        JSON.stringify(gig.style_tags),
        gig.expectation_level,
        gig.status,
        gig.start_date,
        gig.has_docs ? 1 : 0,
        gig.docs_type,
        gig.is_date_fixed ? 1 : 0,
        gig.references_given ? 1 : 0,
        gig.urgency
      ]);
        if (gig.style_tags) {
          for (const styleTag of gig.style_tags) {
            try {
              await database.run(
                'INSERT INTO gig_style_tags (gig_id, style_tag) VALUES ($1, $2) ON CONFLICT (gig_id, style_tag) DO NOTHING',
                [gig.id, styleTag]
              );
            } catch (err) {
              logger.error(`Failed to insert gig_style_tag for gig ${gig.id}: ${err.message}`);
            }
          }
        }
        gigCount++;
      } catch (err) {
        logger.error(`Failed to insert gig ${gig.id} (${i + 1}): ${err.message}`);
      }
    }
    logger.info(`Seeded ${gigCount} gigs`);

    // Seed matches
    logger.info('Seeding matches...');
    let matchCount = 0;
    for (const [i, match] of matchesData.entries()) {
      try {
        await database.run(`
        INSERT INTO matches (
          gig_id, talent_id, status, score, feedback_from_client,
          feedback_from_talent, shared_on, final_decision
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (gig_id, talent_id) DO NOTHING
      `, [
        match.gig_id,
        match.talent_id,
        match.status,
        match.score,
        match.feedback_from_client,
        match.feedback_from_talent,
        match.shared_on,
        match.final_decision
      ]);
        matchCount++;
      } catch (err) {
        logger.error(`Failed to insert match ${match.gig_id}-${match.talent_id} (${i + 1}): ${err.message}`);
      }
    }
    logger.info(`Seeded ${matchCount} matches`);

    // Print summary
    for (const table of ['clients', 'talents', 'gigs', 'matches']) {
      const result = await database.get(`SELECT COUNT(*) as count FROM ${table}`);
      logger.info(`${table}: ${result.count} records`);
    }

    logger.info('Manual seeding completed successfully!');
  } catch (error) {
    logger.error('Manual seeding failed:', error);
  } finally {
    await database.disconnect();
  }
}

manualSeed(); 