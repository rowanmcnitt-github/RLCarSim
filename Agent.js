class Agent
{
    constructor(agent_parameters, max_steps, car)
    {
        this.agent_parameters = {
            'name': agent_parameters['name'],
            'gamma': agent_parameters['gamma'],
            'alpha': agent_parameters['alpha'],
            'epsilon': agent_parameters['epsilon'],
            'epsilon_decay': agent_parameters['epsilon_decay'],
            'learning_type': agent_parameters['learning_type']
        }

        this.rewards = []            //rewards per episode dict
        this.episode_reward = 0
        this.episode_checkpoints = []
        this.num_actions = 5            //left right up down??
        this.num_states = pow(2, car.numRays)
        this.last_immediate_reward = 0
        this.previous_action = 0

        //REWARDS
        this.negative_reward = -20
        this.positive_reward = 2500

        //Q TABLE
        this.q_table = [];

        for(let state_index = 0; state_index < this.num_states; state_index++)
        {
            let current_arr = []
            for(let action_index = 0; action_index < this.num_actions; action_index++)
            {
                current_arr.push(0)
            }
            this.q_table.push(current_arr)
        }


        this.car = car

        this.checkpoints = []
        this.checkpoint_index = 0

        //STATES
        this.current_state = 0
        this.previous_state = 0

        // this.action_dictionary = {
        //     0: {up: 1, down:0, left: 0, right: 0},  //up
        //     1: {up: 0, down:1, left: 0, right: 0},  //down
        //     2: {up: 0, down:0, left: 1, right: 0},  //left
        //     3: {up: 0, down:0, left: 0, right: 1},  //right
        //     4: {up: 1, down:0, left: 1, right: 0},  //up left
        //     5: {up: 1, down:0, left: 0, right: 1},  //up right
        //     6: {up: 0, down:1, left: 1, right: 0},  //down left
        //     7: {up: 0, down:1, left: 0, right: 1},  //down right
        // }

        this.action_dictionary = {
            0: {up: 1, down:0, left: 0, right: 0},  //up
            1: {up: 0, down:0, left: 1, right: 0},  //left
            2: {up: 0, down:0, left: 0, right: 1},  //right
            3: {up: 1, down:0, left: 1, right: 0},  //up left
            4: {up: 1, down:0, left: 0, right: 1},  //up right
        }

        this.current_step = 0
        this.reward = 0
    }
    set_checkpoints(checkpoints) // takes a list of rectangles (x,y) width height
    {
        this.checkpoints = checkpoints
    }
    reset(previous_episode_number, start_angle)
    {
        if(previous_episode_number != -1)
        {
            this.rewards.push(this.episode_reward)
            this.episode_checkpoints.push(this.checkpoint_index)
            this.agent_parameters['epsilon'] *= this.agent_parameters['epsilon_decay']
        }   

        this.checkpoint_index = 0
        this.previous_action = 0
        this.episode_reward = 0

        this.car.reset(start_angle)
    }
    get_dist(p1, p2)
    {
        return(pow(p2.x - p1.x, 2) + pow(p2.y - p1.y, 2))
    }
    step(step_num, draw_car=true)
    {
        if(this.previous_action == -1){this.previous_action = 1}

        this.car.update(this.action_dictionary[this.previous_action], 0.015)

        if(draw_car){this.car.render(this.agent_parameters['name'])}
        

        this.current_state = this.car.get_current_state(this.checkpoints[this.checkpoint_index])

        if(this.car.intersects(this.checkpoints[this.checkpoint_index]))
        {
            this.reward += (this.positive_reward + ((this.checkpoint_index+1) * 100)) // set reward equal to if the car intersects the current checkpoint

            this.checkpoint_index += 1
            this.checkpoint_index = this.checkpoint_index % this.checkpoints.length // go back to first checkpoint
        }
        else if(this.current_state == 0)
        {
            this.reward += this.negative_reward
        }
        else
        {
            this.reward += (this.positive_reward / 200) / this.get_dist(this.car.position, this.checkpoints[this.checkpoint_index]['position']) * (100 * (this.checkpoint_index + 1))
        }

        if(step_num % 5 != 0){return}

        let next_action = -1

        //
        random(0,1) < this.agent_parameters['epsilon'] ? next_action = this.randomStep() : next_action = this.greedyStep(this.current_state)
        //
        
        //Update Q Table
        if(this.agent_parameters['learning_type'] == 'SARSA')
        {
            this.q_table[this.previous_state][this.previous_action] = this.q_table[this.previous_state][this.previous_action] +
                this.agent_parameters['alpha'] *
                (this.reward + (this.agent_parameters['gamma'] * this.q_table[this.current_state][next_action]) - 
                this.q_table[this.previous_state][this.previous_action])
        }

        this.previous_action = next_action

        this.episode_reward += this.reward

        this.reward = 0
    }
    greedyStep(state)
    {
        let best_action = -9999
        let best_action_index = -1

        for(let action_index = 0; action_index < this.num_actions; action_index++)
        {
            if(this.q_table[state][action_index] > best_action)
            {
                best_action = this.q_table[state][action_index]
                best_action_index = action_index 
            }
        }

        return best_action_index
    }
    randomStep()
    {
        return int(random(0, this.num_actions))
    }
}