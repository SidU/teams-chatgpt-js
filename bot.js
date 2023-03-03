const { ActivityHandler, MessageFactory } = require('botbuilder');
const { Configuration, OpenAIApi } = require('openai');

class EchoBot extends ActivityHandler {

    constructor() {
    
        super();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

            // Create an OpenAI API client.
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
              });
            const openai = new OpenAIApi(configuration);

            // Start out by providing a system message to guide the conversation.
            // You can tweak your agent's personality by changing this message.
            if (! this.messages) {
                this.messages = [
                    {"role": "system", "content": "You are a helpful assistant."},
                ];
            }

            // Add the user's message to the conversation.
            this.messages.push({"role": "user", "content": context.activity.text});

            // Call OpenAI to get a response.
            const response = await openai.createChatCompletion({
                "model": "gpt-3.5-turbo",
                "messages": this.messages,
            })

            // Add the bot's response to the conversation so we can provide it in the next request.
            const botMessage = response.data.choices[0].message;
            this.messages.push(botMessage);

            // Only keep the last 10 messages in the conversation to avoid running over prompt limit.
            // Note: this is only good for demo. A more complete implementation would be to summarize
            // the conversation while staying within the token limit.
            // See https://platform.openai.com/docs/guides/chat/managing-tokens
            if (this.messages.length > 10) {
                this.messages.shift();
            }
        
            // Send the bot's response to the user.
            const replyText = botMessage.content;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
