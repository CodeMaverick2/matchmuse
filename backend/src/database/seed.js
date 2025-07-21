const fs = require('fs');
const path = require('path');
const database = require('./connection');
const logger = require('../utils/logger');

/**
 * Data Seeding Script
 * 
 * Imports sample data from JSON files into the database.
 * This script handles the complex data relationships and JSON parsing.
 */
class DataSeeder {
  constructor() {
    this.sampleDataPath = path.join(__dirname, '../../sampledata');
  }

  async seed() {
    try {
      logger.info('Starting data seeding...');
      
      await database.connect();
      
      // Clear existing data
      await this.clearExistingData();
      
      // Seed data in order of dependencies
      await this.seedClients();
      await this.seedTalents();
      await this.seedGigs();
      await this.seedMatches();
      
      logger.info('Data seeding completed successfully');
      
      // Print summary
      await this.printSummary();
      
    } catch (error) {
      logger.error('Data seeding failed:', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }

  async clearExistingData() {
    logger.info('Clearing existing data...');
    
    const tables = [
      'matches',
      'gig_style_tags',
      'gigs',
      'client_style_preferences',
      'clients',
      'talent_availability',
      'talent_portfolio',
      'talent_style_tags',
      'talent_skills',
      'talent_categories',
      'talents',
      'talent_embeddings',
      'gig_embeddings'
    ];

    for (const table of tables) {
      await database.run(`DELETE FROM ${table}`);
    }
    
    logger.info('Existing data cleared');
  }

  async seedClients() {
    logger.info('Seeding clients...');
    
    const clientsData = JSON.parse(
      fs.readFileSync(path.join(this.sampleDataPath, 'sample_clients_database.json'), 'utf8')
    );

    for (const client of clientsData) {
      await database.transaction(async () => {
        // Insert main client record
        await database.run(`
          INSERT INTO clients (
            id, name, type, industry, sub_industry, city, headquarters_city,
            operating_cities, contact_person, designation, communication,
            personality, brand_style, project_behavior, budgeting, client_tier,
            talent_preferences, project_history, inbound_source, important_dates,
            social_profiles, notes_and_history, past_feedback, lead_owner,
            is_repeat_client, attachments_docs_provided
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          client.id,
          client.name,
          client.type,
          client.industry,
          client.sub_industry,
          client.city,
          client.headquarters_city,
          database.stringifyJsonField(client.operating_cities),
          client.contact_person,
          client.designation,
          database.stringifyJsonField(client.communication),
          database.stringifyJsonField(client.personality),
          database.stringifyJsonField(client.brand_style),
          database.stringifyJsonField(client.project_behavior),
          database.stringifyJsonField(client.budgeting),
          client.client_tier,
          database.stringifyJsonField(client.talent_preferences),
          database.stringifyJsonField(client.project_history),
          client.inbound_source,
          database.stringifyJsonField(client.important_dates),
          database.stringifyJsonField(client.social_profiles),
          client.notes_and_history,
          client.past_feedback,
          client.lead_owner,
          client.is_repeat_client ? 1 : 0,
          client.attachments_docs_provided
        ]);

        // Insert style preferences
        if (client.style_preferences) {
          for (const preference of client.style_preferences) {
            await database.run(
              'INSERT INTO client_style_preferences (client_id, style_preference) VALUES (?, ?)',
              [client.id, preference]
            );
          }
        }
      });
    }
    
    logger.info(`Seeded ${clientsData.length} clients`);
  }

  async seedTalents() {
    logger.info('Seeding talents...');
    
    const talentsData = JSON.parse(
      fs.readFileSync(path.join(this.sampleDataPath, 'Talent Profiles.json'), 'utf8')
    );

    for (const talent of talentsData) {
      await database.transaction(async () => {
        // Parse budget range
        const budgetRange = talent.budget_range;
        let budgetMin = null;
        let budgetMax = null;
        
        if (budgetRange && typeof budgetRange === 'string') {
          const match = budgetRange.match(/₹?(\d+)[–-]₹?(\d+)/);
          if (match) {
            budgetMin = parseInt(match[1]);
            budgetMax = parseInt(match[2]);
          }
        }

        // Insert main talent record
        await database.run(`
          INSERT INTO talents (
            id, name, city, hometown, experience_years, budget_min, budget_max,
            soft_skills, software_skills, languages, past_credits, endorsements,
            interest_tags, tier_tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          talent.id,
          talent.name,
          talent.city,
          talent.hometown,
          talent.experience_years,
          budgetMin,
          budgetMax,
          database.stringifyJsonField(talent.soft_skills),
          database.stringifyJsonField(talent.software_skills),
          database.stringifyJsonField(talent.languages),
          database.stringifyJsonField(talent.past_credits),
          database.stringifyJsonField(talent.endorsements),
          database.stringifyJsonField(talent.interest_tags),
          database.stringifyJsonField(talent.tier_tags)
        ]);

        // Insert categories
        if (talent.categories) {
          for (const category of talent.categories) {
            await database.run(
              'INSERT INTO talent_categories (talent_id, category) VALUES (?, ?)',
              [talent.id, category]
            );
          }
        }

        // Insert skills
        if (talent.skills) {
          for (const skill of talent.skills) {
            await database.run(
              'INSERT INTO talent_skills (talent_id, skill) VALUES (?, ?)',
              [talent.id, skill]
            );
          }
        }

        // Insert style tags
        if (talent.style_tags) {
          for (const styleTag of talent.style_tags) {
            await database.run(
              'INSERT INTO talent_style_tags (talent_id, style_tag) VALUES (?, ?)',
              [talent.id, styleTag]
            );
          }
        }

        // Insert portfolio
        if (talent.portfolio) {
          for (const portfolioItem of talent.portfolio) {
            await database.run(`
              INSERT INTO talent_portfolio (talent_id, title, tags, keywords)
              VALUES (?, ?, ?, ?)
            `, [
              talent.id,
              portfolioItem.title,
              database.stringifyJsonField(portfolioItem.tags),
              database.stringifyJsonField(portfolioItem.keywords)
            ]);
          }
        }

        // Insert availability
        if (talent.availability_calendar) {
          for (const availability of talent.availability_calendar) {
            await database.run(`
              INSERT INTO talent_availability (talent_id, city, from_date, to_date)
              VALUES (?, ?, ?, ?)
            `, [
              talent.id,
              availability.city,
              availability.from,
              availability.to
            ]);
          }
        }
      });
    }
    
    logger.info(`Seeded ${talentsData.length} talents`);
  }

  async seedGigs() {
    logger.info('Seeding gigs...');
    
    const gigsData = JSON.parse(
      fs.readFileSync(path.join(this.sampleDataPath, 'Gigs Dataset.json'), 'utf8')
    );

    for (const gig of gigsData) {
      await database.transaction(async () => {
        // Parse budget
        let budget = null;
        if (gig.budget && typeof gig.budget === 'number') {
          budget = gig.budget;
        } else if (gig.budget && typeof gig.budget === 'string') {
          const match = gig.budget.match(/₹?(\d+)/);
          if (match) {
            budget = parseInt(match[1]);
          }
        }

        // Insert main gig record
        await database.run(`
          INSERT INTO gigs (
            id, title, brief_text, category, city, budget, budget_range,
            client_id, style_tags, expectation_level, status, start_date,
            has_docs, docs_type, is_date_fixed, references_given, urgency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          gig.id,
          gig.title,
          gig.brief_text,
          gig.category,
          gig.city,
          budget,
          gig.budget_range,
          gig.client_id,
          database.stringifyJsonField(gig.style_tags),
          gig.expectation_level,
          gig.status,
          gig.start_date,
          gig.has_docs ? 1 : 0,
          gig.docs_type,
          gig.is_date_fixed ? 1 : 0,
          gig.references_given ? 1 : 0,
          gig.urgency
        ]);

        // Insert style tags
        if (gig.style_tags) {
          for (const styleTag of gig.style_tags) {
            await database.run(
              'INSERT INTO gig_style_tags (gig_id, style_tag) VALUES (?, ?)',
              [gig.id, styleTag]
            );
          }
        }
      });
    }
    
    logger.info(`Seeded ${gigsData.length} gigs`);
  }

  async seedMatches() {
    logger.info('Seeding matches...');
    
    const matchesData = JSON.parse(
      fs.readFileSync(path.join(this.sampleDataPath, 'Match History.json'), 'utf8')
    );

    for (const match of matchesData) {
      await database.run(`
        INSERT INTO matches (
          gig_id, talent_id, status, score, feedback_from_client,
          feedback_from_talent, shared_on, final_decision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    }
    
    logger.info(`Seeded ${matchesData.length} matches`);
  }

  async printSummary() {
    logger.info('=== Database Summary ===');
    
    const tables = ['clients', 'talents', 'gigs', 'matches'];
    
    for (const table of tables) {
      const result = await database.get(`SELECT COUNT(*) as count FROM ${table}`);
      logger.info(`${table}: ${result.count} records`);
    }
    
    // Additional statistics
    const categories = await database.all('SELECT category, COUNT(*) as count FROM talent_categories GROUP BY category');
    logger.info('Talent categories:', categories);
    
    const cities = await database.all('SELECT city, COUNT(*) as count FROM talents GROUP BY city ORDER BY count DESC LIMIT 5');
    logger.info('Top talent cities:', cities);
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = new DataSeeder();
  seeder.seed().catch(console.error);
}

module.exports = DataSeeder; 