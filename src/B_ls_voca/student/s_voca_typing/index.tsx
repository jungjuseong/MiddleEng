import * as React from 'react';
import { Observer } from 'mobx-react';

import { StudentContext, useStudent } from '../s_store';
import VocaTypingQuiz from './_voca_typing_quiz';

const VocaTyping = useStudent((store: StudentContext) => (
	<Observer>
		{() => {
			const { viewDiv, prog } = store.state;
			const view = (viewDiv === 'content' && prog === 'spelling');

			return (
				<VocaTypingQuiz 
					view={view}
					entry={(view) ? store.actions.getWord().entry : ''}
					actions={store.actions} 
					state={store.state}
				/>
			);
		}}
	</Observer>
));

export default VocaTyping;